# Feature 3 Analysis

## Original Feature Requirements

As the store Editor, I would like to add the following feature:

1. Add functionality to create and edit a new product in the store.
2. Provide a screen to add a new product or edit an existing product.
3. As Editor (editor role only), show a menu option to create a new product.
4. As Editor (and only in the editor role), show an Edit product option in catalog listing in addition to View item and Add to cart.

## Current State Observations

- Backend currently supports product creation via `POST /api/catalog`, but this endpoint is protected for `manager|admin` and not `editor`.
- Backend does not currently expose a product update endpoint.
- Frontend already has:
  - catalog list page (`StorePage`) with `View item` and `Add to cart`;
  - item detail route/page for viewing and add-to-cart flow.
- Session user data is already available on the frontend (`currentUser`), including normalized `role` and `roleId` from login.
- Existing specs and Cypress coverage focus on shopper workflows; there is no product create/edit editor flow spec yet.

## Architecture Decision

Implement product management with explicit role-gated UI and API:

- Add create/edit product actions in the frontend.
- Add backend endpoint for editing catalog items.
- Update backend product-create authorization to allow `editor` (and align policy decisions for `manager/admin`).
- Reuse one product form screen for both create and edit to keep UX and validation consistent.

This approach extends existing patterns (central app state in `App.jsx`, thin page components, role checks in Express middleware) without broad refactors.

## Authorization Model Proposal

### Required policy for Feature 3

- `editor` can create products.
- `editor` can edit products.
- `manager` and `admin` retain existing create-product access.
- Catalog create/edit controls in the UI are enabled for `editor` role.
- Non-editor roles see create/edit controls in a disabled state with tooltip guidance.

## API and Data Design

### Existing endpoint updates

- `POST /api/catalog`:
  - keep current payload contract (`description`, `priceCents`)
  - update authorization middleware to allow `editor|manager|admin`

### New endpoint

- `PUT /api/catalog/:id` (or `PATCH`, recommended `PUT` for this project style):
  - auth required
  - editor-only authorization
  - validates:
    - item exists by UUID `public_id`
    - non-empty description
    - non-empty header
    - positive integer `priceCents`
  - updates:
    - `description`
    - `header` (manual override supported)
    - `name` to match header (maintain current naming convention)
  - returns updated item in existing catalog response shape

## Frontend Component Design

- `app/frontend/src/App.jsx`
  - add editor capability checks from `currentUser.role`.
  - add routes:
    - create mode (`/store/product/new`)
    - edit mode (`/store/product/:itemId/edit`)
    - keep create/edit entry points available from both catalog list and item detail route
  - add handlers for create/update API calls and catalog state refresh/update.

- `app/frontend/src/components/AppHeader.jsx`
  - add "New product" navigation control with enabled/disabled state based on role.
  - include tooltip text for disabled state (editor-only guidance).

- `app/frontend/src/components/StorePage.jsx`
  - add "Edit product" action for each catalog row with enabled/disabled state based on role.
  - include tooltip text for disabled state (editor-only guidance).
  - preserve existing shopper actions for all roles unless explicitly hidden later.

- `app/frontend/src/components/ItemDetailPage.jsx`
  - add create/edit entry actions with enabled/disabled state based on role.
  - include tooltip text for disabled state (editor-only guidance).

- `app/frontend/src/components/ProductFormPage.jsx` (new)
  - shared form for create/edit modes.
  - fields:
    - header
    - description
    - price
  - handles loading, save success, and validation errors.
  - on success, return to `/store`.

## Testing and Spec Plan

- Add/extend feature specs in `specs/`:
  - positive:
    - editor sees enabled New product navigation
    - editor can create product
    - editor can edit product from catalog list
    - editor can create/edit from item detail page entry points
  - negative:
    - non-editor sees disabled create/edit controls with tooltip explanation
    - unauthorized API attempts return `403`
    - invalid product payload returns `400`

- Add/update Cypress coverage:
  - create new focused spec (recommended `cypress/e2e/catalog-editor.cy.ts`)
  - add/extend page objects for product form interactions
  - use `cy.intercept()` for create/update API assertions

## Implementation Map

### Files to Modify

- `app/backend/src/server.js`
  - update role guard for create endpoint as decided
  - add update endpoint for catalog products

- `app/frontend/src/App.jsx`
  - add editor-aware routes and create/edit handlers

- `app/frontend/src/components/AppHeader.jsx`
  - add editor-only "New product" action

- `app/frontend/src/components/StorePage.jsx`
  - add role-aware "Edit product" action (enabled/disabled)

- `app/frontend/src/components/ItemDetailPage.jsx`
  - add role-aware create/edit entry controls (enabled/disabled)

- `README.md`
  - document new editor product-management behavior and any API notes

- `specs/catalog-cart.feature` and/or new editor-focused spec file
  - define editor workflows and access restrictions

- Cypress page objects/specs under `cypress/pages` and `cypress/e2e`
  - add deterministic tests for editor workflows

### Files to Create

- `app/frontend/src/components/ProductFormPage.jsx`
- `specs/catalog-editor.feature` (recommended)
- `cypress/e2e/catalog-editor.cy.ts` (recommended)
- optional `cypress/pages/ProductFormPage.ts`

## Build Sequence

- [ ] Phase 1: apply role authorization policy (add `editor` while keeping `manager/admin` create rights)
- [ ] Phase 2: backend API changes (`POST` auth update + `PUT /api/catalog/:id`)
- [ ] Phase 3: frontend create/edit UI and routing
- [ ] Phase 4: spec + Cypress coverage updates
- [ ] Phase 5: regression run for login/catalog/checkout plus editor workflows

## Open Questions

- None currently.

## What Changed

- Implemented catalog write-role update in `app/backend/src/server.js` so `POST /api/catalog` now allows `editor|manager|admin`.
- Added `PUT /api/catalog/:id` in `app/backend/src/server.js` with editor-only authorization and validation for `header`, `description`, and `priceCents`.
- Added shared create/edit product form UI in `app/frontend/src/components/ProductFormPage.jsx` with header override support.
- Integrated new product routes and handlers in `app/frontend/src/App.jsx`:
  - create route: `/store/product/new`
  - edit route: `/store/product/:itemId/edit`
  - API handlers for create/update and local catalog state updates.
- Added product management controls to both catalog and detail flows:
  - `app/frontend/src/components/StorePage.jsx`
  - `app/frontend/src/components/ItemDetailPage.jsx`
  - `app/frontend/src/components/AppHeader.jsx`
- Implemented disabled-with-tooltip behavior for non-editor users across header/catalog/detail product controls.
- Added new spec and Cypress coverage for editor workflows:
  - `specs/catalog-editor.feature`
  - `cypress/e2e/catalog-editor.cy.ts`
  - `cypress/pages/ProductFormPage.ts`
  - updated `cypress/pages/CatalogPage.ts` helpers.
- Updated `README.md` API notes to document the new role policy and `PUT /api/catalog/:id`.

### File-by-File Checklist

- [x] `app/backend/src/server.js`
  - Added role-aware create access (`editor|manager|admin`).
  - Added editor-only product update endpoint.

- [x] `app/frontend/src/App.jsx`
  - Added create/edit routes, product API handlers, and state update wiring.

- [x] `app/frontend/src/components/ProductFormPage.jsx`
  - Added shared product create/edit form component.

- [x] `app/frontend/src/components/AppHeader.jsx`
  - Added role-aware New product control with tooltip on disabled state.

- [x] `app/frontend/src/components/StorePage.jsx`
  - Added role-aware New product/Edit product controls with tooltip on disabled state.

- [x] `app/frontend/src/components/ItemDetailPage.jsx`
  - Added role-aware New product/Edit product controls with tooltip on disabled state.

- [x] `specs/catalog-editor.feature`
  - Added feature spec coverage for editor create/edit and non-editor disabled controls.

- [x] `cypress/e2e/catalog-editor.cy.ts`
  - Added E2E tests for editor create/edit flows and tooltip behavior.

- [x] `cypress/pages/ProductFormPage.ts`
  - Added page object helpers for product form interactions.

- [x] `cypress/pages/CatalogPage.ts`
  - Added reusable helpers for new/edit product controls.

- [x] `README.md`
  - Updated API behavior and role policy docs.
