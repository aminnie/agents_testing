# Feature 7 Requirements Clarification

## Original Request

As a Product Owner, I want pagination in the store catalog so the list shows a limited number of products per page.

Requested capabilities:
1. Built-in paging with default page size of 10
2. Page size options: 10, 20, 50
3. Forward and backward paging
4. First and last page shortcuts

## Clarified Requirements

### Goal

Improve catalog browsing usability by limiting visible items and allowing users to navigate predictable pages.

### Functional Behavior

1. Catalog list displays paged results in the UI.
2. Default page size is `10`.
3. User can change page size to one of: `10`, `20`, `50`.
4. Navigation controls include:
   - previous page
   - next page
   - first page
   - last page
5. Current page indicator is visible (for example `Page X of Y`).
6. Page size change resets the current page to page 1 to avoid out-of-range views.

### UX/State Behavior

1. Disable controls when not applicable:
   - `previous` and `first` disabled on first page
   - `next` and `last` disabled on last page
2. Pagination is applied to catalog list view only (not cart).
3. Item detail navigation must preserve and restore exact prior pagination state (page and page size) when returning to catalog.
4. Pagination state resets on each new visit/session (no local storage persistence requirement).
5. Pagination state is represented in URL query params to support deep linking (for example `?page=2&pageSize=20`).
6. Pagination controls appear only below the catalog list.
7. If total items are less than or equal to selected page size, controls remain visible but disabled.

### Non-Functional Expectations

1. Behavior should be deterministic and testable in Cypress.
2. No backend security/auth changes are required.
3. Existing role-based product controls remain unchanged.

## Scope Assumptions

- Initial implementation can be frontend-side pagination over existing catalog response.
- Existing API (`GET /api/catalog`) can remain unchanged unless performance constraints require server-side paging.

## Decision Finalization

1. Page size/state resets with every visit.
2. Query params are required for deep linking.
3. Returning from item detail restores exact previous page and page size.
4. Controls appear below the list only.
5. When total items are less than or equal to selected page size, controls are shown disabled.

## Open Questions

None.

## Next Step Gate

Clarification decisions are now finalized and ready for analysis.

## What Changed

- Backend/API updates shipped:
  - No backend API or schema changes were required for Feature 7.
- Frontend/UI behavior that changed:
  - Added catalog pagination with default page size of 10.
  - Added page size selector with options 10, 20, and 50.
  - Added first/previous/next/last navigation controls below the catalog list.
  - Added page indicator (`Page X of Y`).
  - Implemented query-param-driven state (`page`, `pageSize`) for deep linking.
  - Implemented page-size change behavior that resets page to 1.
  - Preserved exact pagination state when navigating store -> item detail -> return to store.
  - Kept controls visible and disabled when total catalog items fit on one page.
- Test/spec coverage added or modified:
  - Added `specs/catalog-pagination.feature`.
  - Added Cypress suite `cypress/e2e/catalog-pagination.cy.ts`.
  - Extended `cypress/pages/CatalogPage.ts` with pagination helpers.
  - Updated `cypress/e2e/catalog-cart.cy.ts` expectation to align with default paged list size (10).
  - Hardened `cypress/e2e/catalog-pagination.cy.ts` assertions to use runtime catalog size rather than fixed page totals, so tests remain stable when prior specs create additional catalog items.
  - Updated `specs/catalog-pagination.feature` scenarios to describe data-size-aware pagination expectations.
  - Fixed a follow-up flake source in `cypress/e2e/catalog-pagination.cy.ts`: removed dependency on `@catalog` response body size (which is unavailable on `304` responses) and switched to UI-driven pagination assertions.
  - Stabilized deep-link assertion ordering in `cypress/e2e/catalog-pagination.cy.ts` by verifying query params before page-indicator assertions.
  - Added an additional hardening step for cross-run timing variance: the deep-link test now derives `currentPage/totalPages` after navigation to `/store?page=2&pageSize=10`, then validates detail-return preservation against that post-navigation state.
- Docs/script updates needed to support the change:
  - Updated `README.md` to include catalog pagination and deep-link behavior in frontend capabilities.

## Architecture Analysis

### Current State Observations

1. Catalog data is fetched once after login in `app/frontend/src/App.jsx` and stored in memory (`catalog` state).
2. `StorePage` currently renders the full catalog list with no pagination controls.
3. Store route is `/store` and does not currently parse or manage pagination query params.
4. Item detail route (`/store/item/:itemId`) always returns to `/store` without preserving list state in URL.
5. Existing backend endpoint `GET /api/catalog` already returns full item list and is sufficient for initial frontend-side pagination.

### Architecture Decision

Implement pagination in the frontend (client-side) for this feature iteration.

- Use URL query params as source of truth for pagination state:
  - `page` (1-based integer)
  - `pageSize` (allowed: 10, 20, 50)
- Compute paged slice in `App.jsx` and pass paginated catalog plus pagination metadata/actions to `StorePage`.
- Keep controls below catalog list only.
- Show controls at all times in catalog view; when total items are less than or equal to selected page size, render them disabled.
- Preserve pagination context when navigating:
  - from store list to item detail
  - from item detail back to store
  by carrying query params through navigation.
- Do not persist pagination in local storage; URL state is sufficient per requirement.

This keeps API contracts unchanged and limits impact to frontend routing/state + Cypress coverage.

### Routing and State Model

1. Read `page` and `pageSize` from `location.search`.
2. Sanitize values:
   - invalid `pageSize` -> default 10
   - invalid/non-positive `page` -> 1
3. Derive:
   - `totalItems`
   - `totalPages = max(1, ceil(totalItems / pageSize))`
   - `currentPage = min(requestedPage, totalPages)`
   - `pagedCatalog = catalog.slice(startIndex, endIndex)`
4. Write normalized query params back when needed (invalid/out-of-range values).
5. Navigation actions update query params (first/prev/next/last/page size change).
6. Changing page size sets page to 1.

### Component Impact

#### `app/frontend/src/App.jsx`

- Add pagination query parsing and normalization utilities.
- Add handlers for paging actions and page size selection.
- Pass pagination props to `StorePage`:
  - `catalog` (paged subset)
  - `pagination` metadata (`currentPage`, `totalPages`, `pageSize`, `totalItems`)
  - callbacks (`onFirstPage`, `onPrevPage`, `onNextPage`, `onLastPage`, `onPageSizeChange`)
- Update navigation functions to preserve query params:
  - `viewItem(itemId)`
  - item detail return-to-store callback
  - optionally product create/edit return behavior (keep consistent with current `/store` behavior unless explicitly changed in implementation pass).

#### `app/frontend/src/components/StorePage.jsx`

- Render pagination controls below catalog list with stable selectors.
- Render page size selector (`10`, `20`, `50`) and page indicator.
- Disable control states appropriately:
  - first/prev disabled on page 1
  - next/last disabled on last page
  - when `totalItems <= pageSize`, all navigation controls disabled (single-page state).

### Selector Plan (for Cypress stability)

Add `data-cy` hooks in `StorePage`:

- `catalog-pagination`
- `catalog-page-indicator`
- `catalog-page-size`
- `catalog-page-first`
- `catalog-page-prev`
- `catalog-page-next`
- `catalog-page-last`

### Test Strategy

1. Add a new feature spec file: `specs/catalog-pagination.feature`.
2. Add Cypress suite: `cypress/e2e/catalog-pagination.cy.ts`.
3. Extend `cypress/pages/CatalogPage.ts` with pagination helpers.
4. Cover:
   - default page size = 10
   - page size switch to 20 and 50
   - first/prev/next/last behavior
   - disabled controls when list fits on one page
   - deep-link load from query params (e.g., `/store?page=2&pageSize=20`)
   - return from detail preserves pagination query state

### Backend/API Impact

- No backend schema or endpoint changes required for this feature.
- Existing authorization logic remains unchanged.

### Risks and Mitigations

1. **Risk**: out-of-range/invalid query params causing empty views.
   - **Mitigation**: sanitize and normalize query params on load and update URL.
2. **Risk**: lost pagination context during route changes.
   - **Mitigation**: always include current search params when navigating store <-> detail.
3. **Risk**: flaky tests if relying on DOM position.
   - **Mitigation**: use explicit `data-cy` selectors for all pagination controls.

### Implementation Map

#### Files to Modify

- `app/frontend/src/App.jsx`
  - query-param driven pagination state, handlers, and route-preserving navigation
- `app/frontend/src/components/StorePage.jsx`
  - UI controls and page indicator below catalog list
- `cypress/pages/CatalogPage.ts`
  - helper methods for pagination interactions
- `README.md`
  - brief note describing catalog pagination and deep-link behavior
- `requirements/product_feature7.md`
  - keep this file updated with implementation outcomes

#### Files to Create

- `specs/catalog-pagination.feature`
- `cypress/e2e/catalog-pagination.cy.ts`

### Build Sequence

- [x] Phase 1: implement query-param pagination state and sliced ca
talog rendering
- [x] Phase 2: implement control UI + disabled-state behavior in `StorePage`
- [x] Phase 3: preserve query params across store/detail navigation
- [x] Phase 4: add/extend specs and Cypress coverage
- [x] Phase 5: update README and `What Changed` with shipped behavior

## Phase Timeline

- 2026-03-11T14:55:20Z | Timeline | Initialized (backfilled to support phase tracking across clarification, analysis, implementation, testing, and review).