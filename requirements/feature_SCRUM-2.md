# Jira Source: SCRUM-2

- Summary: Feature: Add pagination to the Orders page
- Jira Type: Task
- Jira Status: To Do

## Original Jira Description

As the Store Product owner I would like to:
1. Add pagination to the view oerders page following the same design as the Catalog items list page
1.1. Pagination size should be changable from 10 to 50 in increments of 10
2. A search input box should take either of:
2.1  Order number
2.2 Text input that looks for a potential match in the the item title, description or details
2.3 Present a filtered list of items in the Previous Orders list based on the search match

## Working Requirements
## Source Context

- Source system: Jira
- Source ticket/reference: SCRUM-2
- Source summary: Add pagination and search capabilities to the Previous Orders list view.

As a Product Owner, I would like to:
1. View Previous Orders in paginated form using the same pagination interaction pattern used on the Catalog list page.
2. Change page size using fixed options from 10 to 50 in increments of 10.
3. Search Previous Orders using either an order number or free text matching item title, description, or details.
4. See only matching results when a search term is provided.

## Clarification Decisions

### Decisions Applied

1. Pagination behavior on Previous Orders will mirror the Catalog list behavior and control placement so users get a consistent interaction model.
2. Page size options are fixed to `10`, `20`, `30`, `40`, and `50`, with default page size set to `10`.
3. Search input accepts a single query value:
   - Numeric-only input is treated as an order number search.
   - Any non-numeric input is treated as free-text search over order item `title`, `description`, and `details`.
4. Search and pagination are combined:
   - Filtering is applied first.
   - Pagination is applied to filtered results.
5. Changing search query or page size resets the current page to page 1 to avoid empty or invalid page states.
6. If no records match search, show an explicit empty-state message in the orders list area.

### Requirements Updates

1. The Previous Orders page must render pagination controls using the same UX pattern as the Catalog list page.
2. The page must support configurable page sizes with allowed values: `10`, `20`, `30`, `40`, `50`.
3. The page must default to `10` records per page on initial load.
4. The page must provide one search input field that supports:
   - Order number lookup for numeric-only input.
   - Free-text lookup against order-item title, description, or details for non-numeric input.
5. Search results must be reflected in the visible list and pagination counts.
6. The system must display only matching orders when search is active.
7. When search query changes, pagination state must reset to page 1.
8. When page size changes, pagination state must reset to page 1.
9. When no results match, the UI must render a deterministic "no matching orders" state.

### Acceptance Criteria Updates

1. Given the Previous Orders page is opened, when data is loaded, then pagination controls are visible and styled/interacted consistently with Catalog pagination behavior.
2. Given the page size selector is visible, when the user selects `20`, `30`, `40`, or `50`, then the list updates to that page size and current page resets to 1.
3. Given the user enters a numeric query matching an order number, when search is applied, then only the matching order(s) are shown.
4. Given the user enters non-numeric text present in any order item title, description, or details, when search is applied, then only orders containing matching items are shown.
5. Given the user is on page > 1, when they change search text or page size, then the page resets to 1 and displays results for the new criteria.
6. Given no orders match the current search query, when results render, then the orders list shows a clear empty-state message and no stale prior results.
7. Given a filtered result set that spans multiple pages, when the user navigates pages, then each page shows only records from the filtered set.

### Blocking Questions

None.

### Status

Ready for implementation approval

## Technical Analysis

### Current State Observations

1. Orders list data is currently loaded from `GET /api/orders` in `app/frontend/src/App.jsx` via `loadOrders()` and rendered in `app/frontend/src/components/OrdersPage.jsx`; the API currently returns an unpaginated array `{ orders: [...] }`.
2. Catalog pagination behavior already exists on the frontend and is URL-driven (`page`, `pageSize`, `q`) in `app/frontend/src/App.jsx`, with control rendering in `app/frontend/src/components/StorePage.jsx`.
3. Orders UI currently supports status display and conditional cancellation, but does not provide list-level search or pagination controls.
4. Database schema already supports order-level and item-level data (`orders`, `order_items`, `catalog_items`) needed for text search across related catalog fields.
5. Cypress coverage for orders list currently validates visibility, empty/error states, and cancel-action behavior, but does not validate pagination/search workflows.

### Architecture Decision

Adopt server-side filtering and pagination for `GET /api/orders`, while keeping the existing route (`/orders`) and extending both request query parameters and response metadata.

Decision details:
1. Backend (`app/backend/src/server.js`)
   - Extend `GET /api/orders` to accept:
     - `page` (positive integer, default `1`)
     - `pageSize` (`10|20|30|40|50`, default `10`)
     - `q` (optional search string)
   - Apply search against:
     - `orders.public_order_id` for order-id style matching
     - joined `catalog_items.header`, `catalog_items.name`, `catalog_items.description` via `order_items`
   - Keep sort order `created_at DESC, id DESC` for deterministic results.
   - Return response shape:
     - `orders: [...]` (same item shape as today for compatibility)
     - `pagination: { page, pageSize, totalItems, totalPages }`
     - `filters: { query }`
2. Frontend (`app/frontend/src/App.jsx` + `app/frontend/src/components/OrdersPage.jsx`)
   - Introduce Orders-specific URL params on `/orders`: `page`, `pageSize`, `q`.
   - Load orders from backend using these params (no client-side slice for orders).
   - Render pagination/search controls in `OrdersPage.jsx`, matching Catalog interaction pattern (first/prev/next/last, page indicator, page size select).
   - Preserve existing cancel-order flow by refreshing or patching within current filtered page context.
3. Contract compatibility
   - Existing consumers that ignore extra response fields remain functional.
   - If `/api/orders` is called without query params, behavior defaults to page 1 with size 10 and no search.

### Risk and Regression Considerations

1. **Risk:** Query complexity from joins and text filters may slow responses as data grows.
   - **Mitigation:** Use bounded page sizes, parameterized SQL, and explicit `COUNT(DISTINCT o.id)` for totals. Add/verify indexes on `orders(user_id, created_at)` and `orders(public_order_id)` in `db.js` migration/init flow.
2. **Risk:** Duplicate order rows when joining `order_items` and `catalog_items`.
   - **Mitigation:** Select order IDs in a filtered CTE/subquery with `DISTINCT`, then fetch paged rows by those IDs.
3. **Risk:** Pagination drift after cancel action or filter changes (empty page edge case).
   - **Mitigation:** Reset to page 1 when `q` or `pageSize` changes; when current page becomes invalid after mutation, re-request bounded page from server metadata.
4. **Risk:** UI regression in existing orders list tests due to changed API intercept expectations.
   - **Mitigation:** Update Cypress stubs to include pagination metadata while keeping core assertions for status/cancel behavior.
5. **Security/Input risk:** Unvalidated query strings could allow malformed requests or heavy wildcard searches.
   - **Mitigation:** Validate/normalize `page`, `pageSize`, `q` server-side (length and printable character checks), and use SQL parameters only.

## Implementation Plan

### Files to Modify

1. `app/backend/src/server.js`
   - Extend `GET /api/orders` request parsing/validation and SQL logic for paginated + searchable results.
   - Return `pagination` and `filters` metadata alongside orders.
2. `app/backend/src/db.js`
   - Add/verify supporting indexes for orders list filtering/sorting performance.
3. `app/frontend/src/App.jsx`
   - Add orders-query helpers/state derivation for `/orders` URL params.
   - Update orders loading logic to pass query params and store pagination metadata.
   - Wire search and pagination handlers for orders route.
4. `app/frontend/src/components/OrdersPage.jsx`
   - Add search input/form, clear action, page size control, and page navigation controls using stable `data-cy` selectors.
   - Render deterministic no-results messaging for active search with zero matches.
5. `cypress/pages/OrdersPage.ts`
   - Add page-object helpers for orders search and pagination controls/selectors.
6. `cypress/e2e/orders-list.cy.ts`
   - Add scenarios for page-size changes, page navigation, numeric order-id search, free-text search, and no-match state.
7. `specs/orders-list.feature`
   - Update behavior spec to include pagination and search acceptance coverage.
8. `requirements/feature_SCRUM-2.md`
   - Update `## What Changed`, `## Verification Results`, `## Review Results`, and `## Phase Timeline` during implementation/final pass.

### Build Sequence

1. Implement backend `/api/orders` query validation, filtering, and pagination response metadata.
2. Add/verify DB indexing support in `db.js`.
3. Add frontend `/orders` URL state management and API query wiring in `App.jsx`.
4. Implement Orders page controls and state presentation in `OrdersPage.jsx`.
5. Update Cypress page object and E2E specs based on behavior spec.
6. Run verification scripts and capture results in requirements file.

## Test Strategy

### Primary Validation (Required)

1. API contract validation
   - `GET /api/orders` defaults: returns page 1, size 10, metadata present.
   - `GET /api/orders?page=2&pageSize=20&q=<query>` returns filtered, paged rows with accurate `totalItems/totalPages`.
   - Invalid `pageSize` or malformed query returns deterministic `400` validation error.
2. UI behavior validation
   - Orders page renders pagination controls and search input.
   - Changing page size and search resets to page 1.
   - Numeric query finds matching order IDs.
   - Text query matches item title/description/details.
   - No-match query shows deterministic empty-state message.
3. Regression validation
   - Existing order cancel behavior still works within updated list flow.
   - Navigation to order details still works from filtered/paged list context.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - <summary>
- Backend/API impact:
  - <summary>
- Test/spec changes:
  - <summary>

## Verification Results

- `<command>`
  - Result: <pass/fail + key output>

## Review Results

- Review scope:
  - <files/components reviewed>
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `<path>`: `issueCount: <n>`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-13T15:50:06Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Jira-driven clarification initiated for SCRUM-2.
- 2026-03-13T15:50:06Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Clarification decisions and testable acceptance criteria finalized.
- 2026-03-13T15:51:53Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed existing orders/catalog frontend and backend API behavior.
- 2026-03-13T15:51:53Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Technical analysis, architecture decision, risks, and test strategy finalized.

