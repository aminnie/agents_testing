# Feature 1 Analysis

## Original Feature Requirements

Feature 1 Requirements:

As a store owner I would like to add a catalog of items to be sold on the website.

1. Each item catalog should contain the following details:
1.1 item id (generated UUID)
1.2 item header (generated from the description)
1.3 item detailed description
1.4 item price.

2. Items are presented in the store catalog for users:
2.1 add a view item button next to the add to cart button on each line item presented in the list
2.2 present the item in detail on a seperate item detail screen
2.3 provide the user with an option to 1. add the item to the store cart and 2. return to the list of items after the item as added to the cart, or just return to the list with no item  add.

## Implementation Blueprint

## What Changed in Feature 1

- Backend now supports UUID-backed catalog ids (`public_id`) and generated item headers with migration/backfill logic in `app/backend/src/db.js`.
- Catalog API responses now include `id` (UUID), `header`, `description`, and `priceCents`, and item detail retrieval is available via `GET /api/catalog/:id` in `app/backend/src/server.js`.
- Authorized catalog creation for `manager`/`admin` users is now supported via `POST /api/catalog` with server-side validation and generated UUID/header in `app/backend/src/server.js`.
- Store list now shows a `View item` action next to `Add to cart` and routes into a dedicated item detail screen (`/store/item/:itemId`) through `app/frontend/src/App.jsx` and `app/frontend/src/components/StorePage.jsx`.
- New item detail UI in `app/frontend/src/components/ItemDetailPage.jsx` provides:
  - add item to cart and return to store;
  - return to store without adding.
- Cypress coverage was extended for the detail flow in `cypress/e2e/catalog-cart.cy.ts` and `cypress/pages/CatalogPage.ts`.
- Supporting docs and test workflow updates were made in `README.md`, including argument-forwarding support for `npm run cypress:run -- --spec ...`.

## Patterns & Conventions Found

- Frontend architecture uses React + React Router with orchestration in `app/frontend/src/App.jsx` and presentational page components in `app/frontend/src/components/`.
- Store list and checkout are route-based (`/store`, `/checkout`) and stateful behavior is centralized in `App.jsx` via callback props.
- Existing cart behavior already supports id-based dedupe/increment logic in `addToCart` within `App.jsx`.
- Backend architecture uses Express + SQLite, with schema/bootstrap in `app/backend/src/db.js` and API handlers in `app/backend/src/server.js`.
- Current catalog API (`GET /api/catalog`) is authenticated and already returns catalog item description + price fields.
- Cypress follows a spec-driven approach with feature files in `specs/`, tests in `cypress/e2e/`, and reusable page objects in `cypress/pages/`.

## Architecture Decision

Implement Feature 1 by extending the existing stack with:

- UUID-backed external item IDs (`public_id`) for catalog items.
- A generated `header` field derived from item description.
- A new item detail route (`/store/item/:itemId`) in the frontend.
- A `View item` action in each catalog row.
- Detail page actions for:
  - add item to cart and return to catalog list;
  - return to catalog list without adding.

This approach preserves current architectural patterns (single state owner in `App.jsx`, thin presentational components, Express route handlers with SQLite persistence) and minimizes refactor risk.

## Component Design

- `app/frontend/src/App.jsx`
  - Add routing for item detail page.
  - Add handlers:
    - navigate to detail from catalog row;
    - add-to-cart from detail and return to list;
    - return to list without cart mutation.
  - Resolve detail item by UUID from loaded catalog data.

- `app/frontend/src/components/StorePage.jsx`
  - Add `View item` button beside `Add to cart` for each row.
  - Accept `onViewItem` callback prop.
  - Add stable `data-cy` selectors for detail navigation controls.

- `app/frontend/src/components/ItemDetailPage.jsx` (new)
  - Render item header, detailed description, and formatted price.
  - Provide:
    - `Add to cart and return`;
    - `Return to list`.
  - Handle states: loading, not found, and loaded.

- `app/backend/src/db.js`
  - Extend schema/migration logic to include:
    - `public_id TEXT UNIQUE`;
    - `header TEXT`.
  - Backfill old rows with generated UUID and derived header.
  - Add index/constraint for efficient UUID lookups.

- `app/backend/src/server.js`
  - Update catalog response mapping to expose UUID as external `id`.
  - Include `header`, `description`, and `priceCents` in responses.
  - Add `GET /api/catalog/:id` for detail retrieval by UUID.
  - Add owner/admin-protected `POST /api/catalog` to create new items with server-generated UUID + header.
  - Update checkout item resolution to handle UUID item IDs from cart payloads.

## Implementation Map

### Files to Modify

- `app/backend/src/db.js`
  - Add migration/backfill for `public_id` + `header`.
  - Ensure new seeds and inserts populate both fields.

- `app/backend/src/server.js`
  - Update `GET /api/catalog` payload contract.
  - Add `GET /api/catalog/:id`.
  - Add `POST /api/catalog` with validation and role checks.
  - Update checkout lookup to UUID-based item references.

- `app/frontend/src/App.jsx`
  - Add item detail route and integration handlers.
  - Pass view-item callbacks into `StorePage`.

- `app/frontend/src/components/StorePage.jsx`
  - Add row-level `View item` control and selector hooks.

- `app/frontend/src/styles.css` (if needed)
  - Adjust layout for dual action buttons and detail card readability.

- `specs/catalog-cart.feature`
  - Add item detail navigation and add/return behavior scenarios.

- `cypress/pages/CatalogPage.ts`
  - Add page object actions for viewing item detail and returning.

- `cypress/e2e/catalog-cart.cy.ts` (or split into focused spec)
  - Add assertions for detail workflow and cart impact.

### Files to Create

- `app/frontend/src/components/ItemDetailPage.jsx`
- `specs/item-detail.feature` (preferred for focused behavior coverage)
- `cypress/e2e/item-detail.cy.ts` (preferred for focused E2E tests)

## Data Flow

1. Authenticated user loads store; frontend requests catalog from `GET /api/catalog`.
2. Catalog items render with `Add to cart` and `View item`.
3. User clicks `View item`; app navigates to `/store/item/:itemId`.
4. Detail page resolves selected item from loaded catalog (optionally fallback to `GET /api/catalog/:id` if needed).
5. User can:
   - add item to cart (existing `addToCart` logic) and return to `/store`;
   - return directly to `/store` without cart changes.
6. Checkout continues using cart IDs, now mapped to UUID-backed catalog items server-side.
7. Owner catalog creation uses `POST /api/catalog`; server validates input, generates UUID/header, persists, and returns created item.

## Build Sequence

- [ ] Phase 1: Data contract and migrations
  - [ ] Add `public_id` and `header` schema support.
  - [ ] Backfill existing rows safely.

- [ ] Phase 2: API updates
  - [ ] Update `GET /api/catalog`.
  - [ ] Add `GET /api/catalog/:id`.
  - [ ] Add protected `POST /api/catalog`.
  - [ ] Ensure checkout resolves UUID item IDs correctly.

- [ ] Phase 3: Frontend UX
  - [ ] Add `View item` in catalog list.
  - [ ] Add `ItemDetailPage` and route integration.
  - [ ] Implement add-and-return and return-only actions.

- [ ] Phase 4: Specs and Cypress
  - [ ] Update/add feature files under `specs/`.
  - [ ] Add/extend page objects and E2E specs.
  - [ ] Add intercept aliases and assertions for critical requests.

- [ ] Phase 5: Regression checks
  - [ ] Validate login/session continuity.
  - [ ] Validate cart and checkout totals/order behavior.

## Critical Details

- Error handling:
  - 400 for invalid payloads, 401 for unauthenticated, 403 for unauthorized catalog creation, 404 for missing catalog item.
  - Detail UI must provide clear not-found + return path.

- State management:
  - Keep cart and catalog state centralized in `App.jsx`.
  - Do not duplicate cart logic in detail component.

- Testing:
  - Include positive and negative scenarios from feature specs.
  - Use stable selectors (`data-cy`) and intercept aliases.
  - Avoid arbitrary waits.

- Performance:
  - Index UUID key for lookups.
  - Keep list/detail render lightweight and deterministic.

- Security:
  - Use `crypto.randomUUID()` for IDs.
  - Enforce role checks for creation endpoint.
  - Validate/sanitize request body fields.
  - Keep parameterized SQL usage.
