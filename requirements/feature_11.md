# Feature 11 Requirements Clarification

## Original Request

As a Product Owner of this store application, I would like to add a feature that enables the site `admin` to change a person's role assignment to any of the available roles.

Requested outcomes:

1. Create a new user edit screen similar to the existing registration screen.
2. Add a role dropdown listing available role types and allow admin selection.
3. Provide a save button so admin can persist role changes (and any other editable fields shown).
4. Make user edit screen admin-only.
5. Provide navigation to user edit screen for admins only.

## Clarified Requirements (Finalized)

### Goal

Allow administrators to manage user role assignments safely from the UI, while preserving existing authentication and role-based behavior.

### Functional Requirements

1. Add an admin-only user management entry point in authenticated navigation.
2. Add an admin-only user edit page that allows selecting a target user and editing that user record.
3. User edit form must include:
   - user email (editable),
   - display name (editable),
   - role dropdown with available roles from `role_types`.
4. Admin can change role assignment to any available role (`admin`, `manager`, `user`, `editor`).
5. Save action persists changes and confirms success/failure in deterministic UI messaging.
6. Non-admin users must not see navigation to this screen and must receive `403` if they attempt direct route/API access.

### API and Authorization Requirements

1. Add admin-only API to fetch users for editing.
2. Add admin-only API to update selected user fields (`email`, `displayName`, `roleId`).
3. Authorization for these APIs must require admin role explicitly (no manager/editor access).
4. API responses should follow existing error style (`400` validation, `401` unauthorized, `403` forbidden, `404` not found).

### Validation and Error Handling

1. Backend validates allowed role values against known role types.
2. Backend prevents invalid/empty display names if editable.
3. Backend validates email format and duplicate-email conflicts on update.
3. Backend should prevent demoting/removing the last admin account (safety guard).
4. UI should surface actionable error messages without exposing internal details.

### Non-Functional Requirements

1. Preserve existing auth/session and store workflows unchanged.
2. Use stable `data-cy` selectors for all new controls.
3. Add Cypress coverage for:
   - admin can open user edit and change role,
   - non-admin cannot access user edit navigation/API/route,
   - invalid update paths return deterministic errors.
4. Update documentation and requirements `## What Changed` section after implementation.

### Out of Scope (Current Feature)

1. Bulk role updates.
2. Invite workflow/email notifications.
3. Audit trail/history screen.
4. Fine-grained permission matrix beyond current role model.

## Open Questions Needing Your Decisions

Resolved.

## Decision Finalization

1. Edit scope: allow updates to `email`, `displayName`, and `role`.
2. Self-role update: admin is allowed to edit their own role.
3. Safeguard: final-admin protection is mandatory.
4. Navigation placement: add admin user-management entry to top navigation.
5. UX scope: v1 will use simple list/select (no search/filter).

## Finalized Requirements Additions

1. `PUT /api/admin/users/:id` must support payload fields `{ email, displayName, roleId }`.
2. Backend must enforce deterministic uniqueness validation for updated email values.
3. Final-admin safeguard must block any update (including self-update) that would result in zero admin users.
4. Header must include admin-only navigation entry for user management.
5. Initial UI scope uses straightforward user list/select control without search or filtering.

## Next Step Gate

Decisions are finalized and Feature 11 is ready for implementation.

## Technical Architecture Analysis

### Current State Observations

1. Authentication/session is already role-aware and centralized in backend:
   - roles are resolved through `users.role_id` -> `role_types` in `app/backend/src/server.js`.
2. Admin role exists in seeded role model (`admin`, `manager`, `user`, `editor`) in `app/backend/src/db.js`.
3. Existing authorization middleware pattern is route-level and explicit (`requireCatalogWriteAccess`, `requireCatalogProductManager`), so admin-only middleware is a natural extension.
4. Frontend route/state orchestration is centralized in `app/frontend/src/App.jsx`, with role checks done from `currentUser.role`.
5. Header navigation already supports role-based visibility via props in `app/frontend/src/components/AppHeader.jsx`, which is the best place to surface admin-only entry points.

### Architecture Decision

Implement a dedicated **admin-only user management flow** with:

1. new backend admin APIs for listing users, listing roles, and updating selected user,
2. explicit admin-only authorization middleware,
3. new frontend admin route and user edit screen using the existing MUI patterns,
4. role-based navigation visibility for admin users only,
5. Cypress coverage for positive and forbidden access paths.

This is the smallest coherent design that aligns with current patterns and keeps behavior deterministic.

### Finalized Decisions Applied to This Analysis

1. Edit scope includes `email`, `displayName`, and `role`.
2. Admin can update their own role, but cannot violate final-admin safeguard.
3. Final-admin safeguard is mandatory.
4. Admin navigation entry is in top header navigation.
5. V1 UX uses simple list/select (no search/filter).

### Backend Component Design

#### Authorization middleware

Add `requireAdminAccess` in `app/backend/src/server.js`:

1. resolve requester role via existing `getUserRole(req.userId)`,
2. require role === `admin`,
3. return `401` if missing session and `403` if non-admin.

#### New APIs

1. `GET /api/admin/users`
   - auth: `authMiddleware` + `requireAdminAccess`
   - returns users ordered by id:
     - `id`, `email`, `displayName`, `role`, `roleId`
2. `GET /api/admin/roles`
   - auth: admin-only
   - returns role types from `role_types`:
     - `id`, `name`
3. `PUT /api/admin/users/:id`
   - auth: admin-only
   - body: `{ email, displayName, roleId }`
   - validates role exists, displayName non-empty, email format, and email uniqueness
   - enforces final-admin safeguard:
     - block update if target is admin and resulting admin count would become `0`
   - returns updated user payload.

#### Data considerations

1. No schema change required; fields already exist (`display_name`, `role_id`, `role`).
2. On update, keep `users.role` and `users.role_id` synchronized:
   - set `role` to selected role name from `role_types`.
3. Add deterministic conflict/not-found handling:
   - `404` for unknown user,
   - `400` for invalid role/display/email values,
   - `409` for duplicate email conflict,
   - `409` for protected final-admin transition.

### Frontend Component Design

#### Route and state integration (`app/frontend/src/App.jsx`)

1. Add `isAdmin = currentUser?.role === "admin"`.
2. Add admin-only route:
   - `/admin/users`
3. Add API handlers:
   - load users list,
   - load role options,
   - submit user updates.
4. Block non-admin direct route access client-side by redirecting to `/store`.

#### Header integration (`app/frontend/src/components/AppHeader.jsx`)

1. Add optional admin nav action:
   - e.g., button `User Admin` with `data-cy="nav-user-admin"`.
2. Render only when `isAdmin` prop is true.

#### New page component

Create `app/frontend/src/components/UserAdminPage.jsx`:

1. MUI card/layout matching existing visual style.
2. User selector/list:
   - `data-cy="admin-user-select"`.
3. Edit form:
   - email input (`data-cy="admin-user-email"`),
   - display name input (`data-cy="admin-user-display-name"`),
   - role dropdown (`data-cy="admin-user-role"`),
   - save button (`data-cy="admin-user-save"`).
4. Deterministic success/error regions:
   - `data-cy="admin-user-success"`, `data-cy="admin-user-error"`.

### API/Data Flow

1. Admin logs in.
2. Admin navigates via header to `/admin/users`.
3. Frontend requests users + roles via admin APIs.
4. Admin selects user and edits email/displayName/role.
5. Frontend submits `PUT /api/admin/users/:id` with updated fields.
6. Backend validates admin access + payload + role + final-admin rule.
7. Backend persists updates and returns normalized user data.
8. Frontend reflects saved changes and shows confirmation.

### Files to Modify

1. `app/backend/src/server.js`
   - add admin middleware + three admin APIs.
2. `app/frontend/src/App.jsx`
   - add admin route, admin state/handlers, role gate.
3. `app/frontend/src/components/AppHeader.jsx`
   - add admin-only nav action.
4. `README.md`
   - document admin user-management feature + new admin API notes.
5. `requirements/feature_11.md`
   - update `## What Changed` after implementation.

### Files to Create

1. `app/frontend/src/components/UserAdminPage.jsx`
2. `cypress/e2e/admin-user-management.cy.ts`
3. `cypress/pages/UserAdminPage.ts` (recommended page object)
4. `specs/admin-user-management.feature`

### Verification Plan

1. API checks:
   - admin success paths,
   - non-admin `403`,
   - invalid role/display/email validation,
   - duplicate email conflict behavior.
2. UI checks:
   - admin sees nav + page,
   - non-admin does not see nav and cannot use direct route.
3. Cypress coverage:
   - admin updates user role successfully,
   - non-admin forbidden API/route behavior,
   - final-admin safeguard rejection path.

### Build Sequence (Implementation Checklist)

1. Backend: add admin middleware + APIs + final-admin safeguard.
2. Frontend: add admin route, page, and header entry.
3. Cypress/specs: add admin user-management coverage.
4. Docs: update README and this requirements file `## What Changed`.
5. Final pass: run `npm run workflow:final-pass` and execute `AGENT-REVIEW.md`.

## What Changed

- Backend/API updates shipped:
  - Added admin-only authorization middleware in `app/backend/src/server.js` for user-management endpoints.
  - Added `GET /api/admin/roles` to return role types.
  - Added `GET /api/admin/users` to return user edit data (`id`, `email`, `displayName`, `role`, `roleId`).
  - Added `PUT /api/admin/users/:id` to update `email`, `displayName`, and `roleId`.
  - Enforced deterministic validations:
    - invalid user id / role id / email format -> `400`,
    - duplicate email conflict -> `409`,
    - unknown user -> `404`,
    - final-admin safeguard violation -> `409`.
- Frontend/UI behavior that changed:
  - Added `User admin` top-navigation entry visible to admin users only.
  - Added new admin page `app/frontend/src/components/UserAdminPage.jsx` with:
    - user list and selector,
    - editable email field,
    - editable display-name field,
    - role selector,
    - save action with success/error feedback.
  - Added admin-only route `/admin/users` and client-side redirect to `/store` for non-admin users.
- Test/spec coverage added or modified:
  - Added `cypress/e2e/admin-user-management.cy.ts` with coverage for:
    - admin successful updates,
    - non-admin nav/route/API restrictions,
    - final-admin safeguard rejection.
  - Hardened final-admin safeguard test to be data-state-aware by asserting current admin count and validating that admin count never drops to zero after attempted demotion.
  - Added page object `cypress/pages/UserAdminPage.ts`.
  - Added behavior spec `specs/admin-user-management.feature`.
  - Extended accessibility automation coverage for Feature 11:
    - added admin user-management WCAG checks in `cypress/e2e/accessibility.cy.ts`,
    - updated `specs/accessibility.feature` with admin-page accessibility scenario.
- Docs/script updates needed to support the change:
  - Updated `README.md` feature list and API notes with admin user-management capabilities and endpoints.

## Phase Timeline

- 2026-03-11T14:55:20Z | Timeline | Initialized (backfilled to support phase tracking across clarification, analysis, implementation, testing, and review).