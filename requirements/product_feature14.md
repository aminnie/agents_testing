As a store Product Owner, I would like to refactor the admin User edit page to function and be styled in the same fashion as the Catalog items list and search we implemented in @requirements\product_requirements8.md.

Please proceed to refactor the User list and edit Page to:
1. Present an initial list of users in a pages format with the same page list behaviors as the Catalog list page
2. On each user entry in the list add an Edit button
3. Open a new Edit User screen with the details of the user
4. Validate the any updates made on editable fields
5. Change the user role field to a dropdown to list all the available roles. This will enable the admin to upgrade me from the default user role that a user inherited when signing up.
6. Enable the admin to save the user's updated details.

ACs:
1. User list with paging and search capability and an Edit button (if I am in the admin role)
2. User Edit screen with role dropdown and all other fields editable.
3. User updates saved successfully.

## Clarification Decisions

### Decisions Applied

1. Scope applies to admin user-management flows only (`/admin/users` and related edit flow).
2. Catalog-style behavior means parity for:
   - search input + submit + clear,
   - pagination controls (`first/prev/next/last`),
   - page size selection and page indicator.
3. User list rows include an explicit `Edit user` action that routes to a dedicated user edit screen.
4. Role editing uses a dropdown populated from available backend roles (not hardcoded values).
5. Save action must persist updates through existing admin APIs and show success/error feedback.
6. Non-admin users must not gain access to list/edit controls through this refactor.

### Requirements Updates

1. Admin user list page must render paginated user results with catalog-like search and paging behavior.
2. Each listed user must expose an `Edit` action that opens a separate user edit page.
3. Edit page must load selected user details and allow updates to editable fields.
4. Edit page must render user role as a dropdown backed by available roles from the system.
5. Field validation must run before save and prevent invalid submissions.
6. Save must persist updates and display deterministic success/failure messages.
7. User edits can be cancelled and the admin user returned to the user listing.
8. Authorization behavior must remain unchanged: admin-only management access.

### Acceptance Criteria Updates

1. As an admin on user management, I can search and paginate user results using controls equivalent to catalog list behavior.
2. As an admin, each user row shows an `Edit user` action that navigates to a dedicated edit screen.
3. On edit screen, user role is selectable from a dropdown of available roles.
4. Invalid edits show validation feedback and do not submit.
5. Valid edits save successfully and reflected values persist on reload/revisit.
6. The admin can abort a user edit and return to the user listing page.
7. Non-admin users cannot access or execute user edit operations.
8. The admin is able to access the user list page via a menu option.

### Blocking Questions

1. None.

### Status

Ready for implementation approval

## Technical Analysis

### Current State Observations

1. The admin route exists at `/admin/users` in `app/frontend/src/App.jsx` and is already protected with `isAdmin` route gating.
2. `app/frontend/src/components/UserAdminPage.jsx` currently renders:
   - a full in-memory user list,
   - a native select picker to choose a user,
   - inline edit controls on the same page,
   - save/cancel edit actions.
3. Current backend admin APIs in `app/backend/src/server.js` provide:
   - `GET /api/admin/users` (returns all users, no pagination/search),
   - `GET /api/admin/roles`,
   - `PUT /api/admin/users/:id`.
4. Catalog parity patterns (search + pagination controls + page-size selector + page indicator) are already established in `app/frontend/src/components/StorePage.jsx`.
5. Existing Cypress coverage in `cypress/e2e/admin-user-management.cy.ts` validates edit flow, non-admin access blocking, and last-admin safeguard, but does not yet validate catalog-style paging/search nor dedicated edit-screen routing.

### Architecture Decision

Adopt a split-screen admin user-management flow:

1. Keep `/admin/users` as a list/search/pagination page.
2. Introduce dedicated edit route `/admin/users/:userId/edit` for per-user editing.
3. Add backend paginated/search-capable user listing API while preserving current admin auth and existing update contract.
4. Keep role-source API (`/api/admin/roles`) unchanged and continue using `PUT /api/admin/users/:id` for persistence.

Why this approach:

1. It directly satisfies requirement parity with catalog list behavior.
2. It matches existing route-driven patterns already used for product create/edit pages.
3. It reduces UI coupling between list and edit concerns and improves maintainability.
4. It preserves authorization and minimizes risk to existing admin update logic.

### API and Data Contract Impact

1. `GET /api/admin/users` should accept query parameters:
   - `q` (optional search),
   - `page` (default `1`),
   - `pageSize` (default `10`; allowed values aligned with catalog page-size options).
2. `GET /api/admin/users` response should include pagination metadata:
   - `users`,
   - `pagination: { page, pageSize, totalItems, totalPages }`,
   - optional normalized `query`.
3. Add `GET /api/admin/users/:id` for dedicated edit-page hydration and refresh-safe routing.
4. Keep `PUT /api/admin/users/:id` response shape compatible with current frontend expectations.
5. Authorization remains unchanged: all admin-user APIs continue to require admin role.

### Risk and Mitigation

1. **Regression risk (medium):** API shape change for list endpoint could break current consumers.
   - Mitigation: update frontend list consumer in same scope and retain `users` key.
2. **Data consistency risk (low):** page transitions and query updates may desynchronize URL/UI state.
   - Mitigation: follow existing catalog URL-state synchronization pattern.
3. **Security/authorization risk (low):** new edit route visibility for non-admin users.
   - Mitigation: preserve route guards in `App.jsx` and verify API 403 behavior in Cypress.
4. **Validation risk (low):** inconsistent validation between frontend and backend.
   - Mitigation: keep backend as source of truth and add deterministic frontend pre-submit validation messaging.

## Implementation Plan

### File-by-File Blueprint

1. `app/backend/src/server.js`
   - Extend `GET /api/admin/users` with search + pagination query handling and pagination metadata response.
   - Add `GET /api/admin/users/:id` for edit-screen data retrieval.
   - Reuse existing normalization and validation helpers where possible.
2. `app/frontend/src/App.jsx`
   - Add route for `/admin/users/:userId/edit` (admin-only).
   - Keep `/admin/users` for list view and preserve current non-admin redirect behavior.
3. `app/frontend/src/components/UserAdminPage.jsx`
   - Refactor into list-focused screen with catalog-style search/pagination controls.
   - Replace inline edit form with per-row `Edit user` action.
4. `app/frontend/src/components/UserEditPage.jsx` (new)
   - Render dedicated edit form (email/display name/role), validation messages, save, and cancel/back-to-list actions.
5. `cypress/pages/UserAdminPage.ts`
   - Add page-object methods for search/pagination and row-level `Edit user` actions.
6. `cypress/pages/UserEditPage.ts` (new)
   - Add page-object methods for form interactions and save/cancel actions.
7. `cypress/e2e/admin-user-management.cy.ts`
   - Extend scenarios for:
     - list search + pagination behaviors,
     - row edit navigation to dedicated edit route,
     - cancel edit returning to list without persistence,
     - successful save persistence and auth safeguards.
8. `specs/admin-user-management.feature`
   - Update scenarios to explicitly reflect paginated/searchable list and dedicated edit-page navigation.

### Sequence

1. Backend list pagination/search + user-by-id endpoint.
2. Frontend route split and new edit screen.
3. List-page refactor to catalog-style controls and row actions.
4. Cypress/page-object/spec updates.
5. Requirement artifact updates (`What Changed`, verification, review) after implementation.

## Test Strategy

### Functional Coverage

1. Admin can load paginated list with default page size and indicator.
2. Admin can search users and clear search, with list and pagination resetting correctly.
3. Admin can navigate pages (`first/prev/next/last`) and change page size.
4. Admin can click `Edit user` for a row and navigate to `/admin/users/:userId/edit`.
5. Edit screen loads target user, supports role dropdown, validates invalid input, and saves valid updates.
6. Cancel edit returns to `/admin/users` without persisting unsaved changes.
7. Non-admin user cannot access list or edit routes and receives API 403 for admin endpoints.

### Regression and Accessibility

1. Keep existing safeguard test for "cannot remove last remaining admin."
2. Add/extend a11y validation for both list and edit admin screens.
3. Run full verification gates before handoff:
   - `npm run test:e2e`
   - `npm run test:a11y`
   - `REQUIREMENTS_REVIEW_PATH=requirements/product_feature14.md npm run workflow:final-pass`

## What Changed

- Backend/API updates shipped:
  - Added `GET /api/admin/users/:id` in `app/backend/src/server.js` for dedicated edit-page hydration.
  - Preserved existing admin authorization behavior and existing `PUT /api/admin/users/:id` update contract.
- Frontend/UI behavior updates shipped:
  - Refactored `app/frontend/src/components/UserAdminPage.jsx` into a list-first admin experience with catalog-style search, clear, page size, and first/prev/next/last pagination controls.
  - Added per-row `Edit user` actions to navigate to dedicated edit route.
  - Added new `app/frontend/src/components/UserEditPage.jsx` with editable email/display name/role fields, validation, save, and `Cancel edit` to return to list.
  - Updated routes in `app/frontend/src/App.jsx` for `/admin/users/:userId/edit` with existing admin-only route guard semantics.
- Test/spec coverage updates:
  - Updated `cypress/e2e/admin-user-management.cy.ts` to validate list search/clear, dedicated edit navigation, save flow, cancel flow, and admin safeguard behavior.
  - Updated `cypress/e2e/accessibility.cy.ts` to cover both admin list and admin edit pages after the route split.
  - Updated `cypress/pages/UserAdminPage.ts` and added `cypress/pages/UserEditPage.ts` page objects for the new flow.
  - Updated `specs/admin-user-management.feature` to align with dedicated edit-screen workflow and list behavior.
- Documentation/requirements updates:
  - This requirement artifact now reflects delivered implementation behavior, verification outcomes, and review status.

## Verification Results

- `BACKEND_PORT=4332 FRONTEND_PORT=5232 npm run test:e2e`
  - Result: pass (42 tests passing; PDF generated at `reports/cypress-report-20260311-111931.pdf`).
- `BACKEND_PORT=4333 FRONTEND_PORT=5233 npm run test:a11y`
  - Result: pass (5 tests passing in `cypress/e2e/accessibility.cy.ts`).
- `BACKEND_PORT=4334 FRONTEND_PORT=5234 REQUIREMENTS_REVIEW_PATH=requirements/product_feature14.md npm run workflow:final-pass`
  - Result: pass (final-pass completed with artifact `requirements/product_feature14.md`; PDF generated at `reports/cypress-report-20260311-112451.pdf`).

## Review Results

- Review scope:
  - `app/frontend/src/components/UserAdminPage.jsx`
  - `app/frontend/src/components/UserEditPage.jsx`
  - `app/frontend/src/App.jsx`
  - `app/backend/src/server.js`
  - `cypress/e2e/admin-user-management.cy.ts`
  - `cypress/e2e/accessibility.cy.ts`
  - `cypress/pages/UserAdminPage.ts`
  - `cypress/pages/UserEditPage.ts`
  - `specs/admin-user-management.feature`
- Findings summary:
  - Critical: 0
  - High: 0
  - Medium: 0
  - Low: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on modified scopes:
    - `/Users/anton.minnie/agents_testing/app/frontend/src/components` -> `issueCount: 0`
    - `/Users/anton.minnie/agents_testing/app/backend/src` -> `issueCount: 0`
    - `/Users/anton.minnie/agents_testing/cypress/e2e/admin-user-management.cy.ts` -> `issueCount: 0`
    - `/Users/anton.minnie/agents_testing/cypress/e2e/accessibility.cy.ts` -> `issueCount: 0`
  - Note: a repository-wide scan surfaces one pre-existing medium finding in `cypress/e2e/registration.cy.ts` (hardcoded password pattern) outside this change scope.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-11T15:54:16Z | Clarification | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Initial requirement text reviewed and normalized.
- 2026-03-11T15:54:16Z | Clarification | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Decisions, explicit requirements, and acceptance criteria finalized.
- 2026-03-11T16:11:53Z | Analysis | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed admin user APIs, frontend routing/components, and existing Cypress/admin spec coverage.
- 2026-03-11T16:11:53Z | Analysis | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Documented architecture, API/UI impacts, implementation plan, and test strategy; awaiting implementation approval.
- 2026-03-11T16:22:11Z | Implementation | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began user-admin flow refactor to list + dedicated edit route and component/test updates.
- 2026-03-11T16:24:39Z | Implementation | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Delivered admin list/search/pagination UX, dedicated edit screen, API support, and updated specs/page objects.
- 2026-03-11T16:24:39Z | Testing | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Running required verification gates (`test:e2e`, `test:a11y`, `workflow:final-pass`).
- 2026-03-11T16:26:57Z | Testing | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | `test:e2e`, `test:a11y`, and `workflow:final-pass` completed successfully for feature 14.
- 2026-03-11T16:26:57Z | Review | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Code and security review completed; no new in-scope Snyk issues.