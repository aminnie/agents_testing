# Feature 5 Requirements Clarification

## Original Request

As a store Product Owner, make the following change to the store application:

1. Hide the product create and edit menu options and buttons from normal user roles.
2. Remove the "New Product" button from the catalog listing.

## Clarified Requirements

### Role interpretation

- `editor` and `manager` are the product-management roles in the UI.
- "Normal user roles" are treated as non-manager/non-editor users (`user`, `admin`).

### UI behavior

1. For non-manager/non-editor users:
   - Hide product-management controls (do not show disabled controls/tooltips).
   - Affected controls:
     - `New product` in top navigation
     - `New product` in catalog section
     - `Edit product` controls in catalog list
     - `New product` and `Edit product` controls on item detail page

2. Catalog listing:
   - Remove the `New product` button from the catalog section entirely.
   - Product creation remains accessible through top navigation for editor users (unless changed by decision below).

### Backend/API behavior

- Authorization policy for product management should be:
  - `POST /api/catalog` allowed for `editor|manager`
  - `PUT /api/catalog/:id` allowed for `editor|manager`
- No payload contract changes are required.

## Scope Notes

- This requirement is a UI visibility/accessibility adjustment, not a role-policy/API change.
- Existing product create/edit routes can remain in place; only entry-point visibility changes are required.

## Open Questions

- None currently.

## Current State Observations

- Product-management controls are currently shown for all authenticated users, but disabled for non-editor users.
- Catalog list currently includes a `New product` button in addition to `Edit product` row actions.
- Item detail page currently includes both `New product` and `Edit product` actions with role-based disabled states.
- Backend currently authorizes:
  - `POST /api/catalog` for `editor|manager|admin`
  - `PUT /api/catalog/:id` for `editor` only
- This differs from Feature 5 target behavior (`manager|editor` only, and hidden controls for non-manager/non-editor users).

## Architecture Decision

Implement Feature 5 with explicit role-gated visibility and aligned API authorization:

- Product-management UI controls are visible only to `manager|editor`.
- Remove the catalog-section `New product` button entirely for all roles.
- Keep the top-nav `New product` entry point for `manager|editor` as the canonical create path.
- Keep item-detail `Edit product` entry for `manager|editor` to preserve fast edit workflow.
- Align backend authorization to `manager|editor` for both create and edit endpoints.

This is the smallest safe change set that matches the requested behavior while preserving existing create/edit workflows.

## UI/UX Behavior Specification

### Visibility rules

- `manager|editor`:
  - see `New product` in top navigation
  - see `Edit product` in catalog rows
  - see `New product` and `Edit product` on item detail

- `user|admin`:
  - do not see any product-management controls
  - continue to see shopper flows only (`View item`, `Add to cart`, checkout)

### Global removal

- Remove catalog-section `New product` button for all roles.

## Backend/API Behavior Specification

- `POST /api/catalog` authorization: `manager|editor` only
- `PUT /api/catalog/:id` authorization: `manager|editor` only
- Keep existing payloads and response shapes unchanged.

## Implementation Map

### Files to Modify

- `app/backend/src/server.js`
  - Update create middleware role check to drop `admin`.
  - Update edit middleware role check to include `manager`.

- `app/frontend/src/App.jsx`
  - Replace editor-only checks with product-manager checks (`manager|editor`).
  - Continue passing role-gated props to header/store/detail components.

- `app/frontend/src/components/AppHeader.jsx`
  - Hide `New product` button for non-manager/non-editor users.

- `app/frontend/src/components/StorePage.jsx`
  - Remove catalog-section `New product` button.
  - Hide row-level `Edit product` button for non-manager/non-editor users.

- `app/frontend/src/components/ItemDetailPage.jsx`
  - Hide `New product` and `Edit product` actions for non-manager/non-editor users.

- `specs/catalog-editor.feature`
  - Update role expectations for manager access and admin restrictions.

- `cypress/e2e/catalog-editor.cy.ts`
  - Add manager-positive coverage.
  - Replace non-editor disabled assertions with hidden-control assertions.
  - Add admin-negative coverage for hidden controls and `403` on direct API attempt if covered by intercept/API call.

- `README.md`
  - Update API role notes to reflect `manager|editor` product authorization.

## Data Flow

1. User logs in and role is available in frontend session user object.
2. `App.jsx` determines product-management capability (`manager|editor`).
3. Header/store/detail render product controls only when capability is true.
4. Product create/edit requests call existing endpoints.
5. Backend enforces `manager|editor` authorization and returns success/forbidden consistently.

## Build Sequence

- [ ] Phase 1: role-policy update in backend (`POST` + `PUT`)
- [ ] Phase 2: UI visibility update (hide controls + remove catalog new-product button)
- [ ] Phase 3: spec and Cypress updates for manager-positive/admin-user-negative behavior
- [ ] Phase 4: regression run (`npm run test:e2e`) and targeted editor/manager flow checks
- [ ] Phase 5: update docs and confirm `What Changed`

## Critical Details

- Keep frontend hiding as UX behavior, but rely on backend authorization as source of truth.
- Ensure admin users cannot create/edit via API even if they manually navigate to product routes.
- Keep existing non-product workflows unchanged (login, catalog browsing, checkout, help).

## What Changed

- Updated backend product authorization in `app/backend/src/server.js`:
  - `POST /api/catalog` now allows only `manager|editor` (admin removed).
  - `PUT /api/catalog/:id` now allows `manager|editor` (manager added).
- Updated frontend role-gated rendering to hide product-management controls for `user|admin`:
  - `app/frontend/src/components/AppHeader.jsx` now renders `New product` only for `manager|editor`.
  - `app/frontend/src/components/StorePage.jsx` removes catalog-level `New product` and renders row `Edit product` only for `manager|editor`.
  - `app/frontend/src/components/ItemDetailPage.jsx` renders `New product` and `Edit product` only for `manager|editor`.
  - `app/frontend/src/App.jsx` now computes product-management capability as `manager|editor`.
- Updated test/spec coverage for role changes:
  - `cypress/e2e/catalog-editor.cy.ts` now includes manager-positive coverage and hidden-control assertions for user/admin.
  - `specs/catalog-editor.feature` now reflects hidden controls for non-manager/non-editor and manager create path.
- Updated docs in `README.md` to reflect new `manager|editor` API authorization rules.

### File-by-File Checklist

- [x] `app/backend/src/server.js`
  - Enforced `manager|editor` for product create and edit endpoints.

- [x] `app/frontend/src/App.jsx`
  - Switched product-management capability check from editor-only to `manager|editor`.

- [x] `app/frontend/src/components/AppHeader.jsx`
  - Hid `New product` for non-manager/non-editor users.

- [x] `app/frontend/src/components/StorePage.jsx`
  - Removed catalog-level `New product` button.
  - Hid row-level `Edit product` for non-manager/non-editor users.

- [x] `app/frontend/src/components/ItemDetailPage.jsx`
  - Hid detail-level `New product` and `Edit product` for non-manager/non-editor users.

- [x] `cypress/e2e/catalog-editor.cy.ts`
  - Added manager positive flow and user/admin hidden-control assertions.

- [x] `specs/catalog-editor.feature`
  - Updated feature behavior wording for manager support and hidden controls.

- [x] `README.md`
  - Updated API authorization notes for product create/edit roles.
