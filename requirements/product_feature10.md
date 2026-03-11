# Feature 10 Requirements Clarification

## Original Request

As a Product Owner, I would like to add a new user self-registration feature:

1. Create a self-registration page that requests:
   - user first name and last name,
   - user email address (becomes the login name),
   - default role id set to normal `user`.
2. On the application login page, add a link to the new registration page below the login button with message:
   - "Not a registered user, please click here".
3. Save the new user to the `users` table.

## Clarified Requirements (Finalized)

### Goal

Allow new users to create their own account from the login experience without admin intervention, while preserving existing auth and role behavior.

### Functional Requirements

1. Add a public registration page reachable from the login screen.
2. Registration form must capture:
   - display name (required),
   - email (required, used as login identifier),
   - password (required).
3. Submitted registration creates a new user record in the existing `users` table.
4. New users must always be assigned the normal user role (`role = "user"` and corresponding `role_id` for user).
5. Login screen must display a clear registration CTA under the login action:
   - text: "Not a registered user, please click here".
6. Registration flow must prevent duplicate accounts for an email that already exists.
7. After successful registration, user should be automatically logged in and routed to the authenticated store experience.

### Validation and Error Handling

1. Frontend should validate required fields before submit.
2. Backend must validate payload shape and required fields.
3. Password must be at least 8 characters.
4. Backend must reject duplicate emails with deterministic status code/message.
5. Error messaging must be user-safe (no internal stack traces or SQL details).

### Non-Functional Requirements

1. Existing login flow must remain backward-compatible for current demo users.
2. Feature should follow existing role and authorization model with no privilege escalation path.
3. Cypress coverage should be added for:
   - successful registration,
   - duplicate email rejection,
   - login-page navigation to registration page.
4. UI selectors should use stable `data-cy` attributes for test reliability.

### Out of Scope (Current Feature)

1. Email verification workflow.
2. Password reset / forgot password flow.
3. Social login providers.
4. Admin approval workflow for new registrations.

## Open Questions Needing Your Decisions

Resolved.

## Decision Finalization

1. Registration success behavior: auto-login immediately after account creation.
2. Password policy: minimum length of 8 characters.
3. Name model: single display name for now.
4. Availability: registration is open to all visitors.
5. Seeded demo/admin/editor/manager accounts remain non-editable through this self-registration flow.

## Finalized Requirements Additions

1. Registration API response must support immediate authenticated session creation so frontend can auto-login without a second manual login submit.
2. Registration payload should use a single `displayName` field instead of separate first/last name fields for this iteration.
3. Password length validation (>= 8) must be enforced in frontend and backend.
4. Registration route must be accessible without prior authentication.
5. Existing role seed data and privileged accounts are unaffected by this feature.

## Next Step Gate

Decisions are finalized and Feature 10 is ready for architecture analysis and implementation planning.

## Architecture Analysis

### Current State Observations

1. Authentication is currently email/password based and handled by `POST /api/login` in `app/backend/src/server.js`.
2. User records are stored in `users` with `email`, `password`, `role`, and `role_id` in `app/backend/src/db.js`.
3. Session state is token-based in memory (`tokens` map in backend) and persisted client-side in local storage (`STORAGE_KEYS` in `app/frontend/src/App.jsx`).
4. Public routes currently include login (`/`) and help (`/help`), with unauthenticated route protection in `App.jsx`.
5. Login UI is centralized in `app/frontend/src/components/LoginScreen.jsx` and already has stable `data-cy` selectors.

### Architecture Decision

Implement self-registration as a first-class auth flow with:

1. A new public backend endpoint `POST /api/register`.
2. A small `users` schema extension to support `display_name`.
3. Automatic session issuance on successful registration (same response shape as login for immediate auto-login).
4. A new public frontend registration route and form page linked from login.
5. Dedicated Cypress coverage for registration success/failure and login-page navigation.

This approach keeps existing auth/session patterns consistent while adding the new capability with minimal disruption.

### Backend Design

#### API Contract

Add `POST /api/register` in `app/backend/src/server.js`:

- Request body:
  - `displayName` (required, trimmed, non-empty)
  - `email` (required, normalized to lowercase)
  - `password` (required, minimum 8 characters)
- Validation failures: `400` with deterministic message.
- Duplicate email: `409` with deterministic message.
- Success: `201` with same shape as login:
  - `{ token, user: { id, email, role, roleId, legacyRole, displayName } }`
- Role assignment on create:
  - `role = "user"`
  - `role_id = 3`

#### Data Model

Update `app/backend/src/db.js`:

1. Add `display_name` column to `users` if missing (`ALTER TABLE` guarded by `PRAGMA table_info` pattern used elsewhere).
2. Backfill existing users with a deterministic display name (for example, left side of email) when null/blank.
3. Keep existing role migration logic unchanged.

### Frontend Design

#### Routing and Auth Flow

Update `app/frontend/src/App.jsx`:

1. Add unauthenticated route `/register`.
2. Extend route-guard allowlist from `["/", "/help"]` to include `"/register"`.
3. Add registration submit handler:
   - validates required fields + password min length,
   - calls `POST /api/register`,
   - on success uses existing `persistAuth(...)` and navigates to `/store`.
4. Keep login behavior unchanged.

#### Registration UI

Create `app/frontend/src/components/RegisterScreen.jsx`:

1. MUI-based form consistent with current login visual style.
2. Fields:
   - display name (`data-cy="register-display-name"`)
   - email (`data-cy="register-email"`)
   - password (`data-cy="register-password"`)
3. Actions:
   - submit (`data-cy="register-submit"`)
   - back-to-login link/button (`data-cy="register-login-link"`)
4. Error message region (`data-cy="register-error"`).

Update `app/frontend/src/components/LoginScreen.jsx`:

1. Add registration CTA below sign-in action:
   - exact text: "Not a registered user, please click here"
   - selector: `data-cy="login-register-link"`
2. Wire CTA callback from `App.jsx` to navigate to `/register`.

### Security and Validation Strategy

1. Enforce password minimum length (>= 8) in both frontend and backend.
2. Enforce email normalization and duplicate checks server-side.
3. Keep user-safe error messages (no SQL/internal details).
4. Preserve default least-privilege role assignment for all self-registered users (`user` only).

### Cypress Coverage Plan

Add spec `cypress/e2e/registration.cy.ts` with scenarios:

1. Login page shows registration link and navigates to `/register`.
2. New visitor can register successfully and is auto-logged in to `/store`.
3. Duplicate email registration is rejected with deterministic error UI.
4. Password shorter than 8 is blocked (frontend validation and/or backend response path).

If reusable selectors grow, add `cypress/pages/RegisterPage.ts` page object following existing page-object patterns.

### Implementation Map

#### Files to Modify

1. `app/backend/src/db.js`
   - Add `display_name` migration/backfill for `users`.
2. `app/backend/src/server.js`
   - Add `POST /api/register`.
   - Include `displayName` in auth payload mapping where relevant.
3. `app/frontend/src/App.jsx`
   - Add register route, navigation handlers, form state, submit flow, route allowlist update.
4. `app/frontend/src/components/LoginScreen.jsx`
   - Add registration CTA below login submit button.
5. `README.md`
   - Document registration flow and any new run/test notes.
6. `requirements/product_feature10.md`
   - Update `What Changed` after implementation is complete.

#### Files to Create

1. `app/frontend/src/components/RegisterScreen.jsx`
2. `cypress/e2e/registration.cy.ts`
3. `specs/registration.feature`
4. Optional: `cypress/pages/RegisterPage.ts`

### Data Flow

1. Visitor opens login page.
2. Visitor clicks registration link and navigates to `/register`.
3. User submits `displayName`, `email`, `password`.
4. Frontend validates required fields/password length, then calls `POST /api/register`.
5. Backend validates input, enforces uniqueness, inserts user with `user` role defaults, creates token.
6. Backend returns `{ token, user }`.
7. Frontend persists auth/session state via existing storage keys and navigates to `/store`.

### Build Sequence (Implementation Checklist)

1. Backend schema + API:
   - Add `display_name` migration/backfill.
   - Add registration endpoint and validation.
2. Frontend route + form:
   - Create `RegisterScreen`.
   - Wire login CTA and `/register` route.
   - Implement submit/autologin flow.
3. Test coverage:
   - Add Cypress registration spec (and page object if needed).
   - Add matching `specs/registration.feature`.
4. Documentation:
   - Update README registration notes.
   - Update this document `## What Changed` with delivered backend/frontend/tests/docs.

## What Changed

- Backend/API updates shipped:
  - Added `POST /api/register` in `app/backend/src/server.js` to support visitor self-registration with required `displayName`, `email`, and `password`.
  - Registration now enforces password minimum length (`>= 8`) and duplicate-email prevention with deterministic `409` response.
  - Registration success auto-creates an authenticated session and returns login-compatible payload (`token` + `user`).
  - Updated `POST /api/login` response to include `user.displayName`.
- Frontend/UI behavior that changed:
  - Added public registration route `/register` to unauthenticated navigation in `app/frontend/src/App.jsx`.
  - Added `RegisterScreen` (`app/frontend/src/components/RegisterScreen.jsx`) with display-name/email/password inputs and stable `data-cy` selectors.
  - Added login-page CTA in `app/frontend/src/components/LoginScreen.jsx` with exact requested text:
    - "Not a registered user, please click here".
  - Successful registration now auto-logs the user into `/store`.
- Data model updates shipped:
  - Added migration in `app/backend/src/db.js` for `users.display_name` (if missing).
  - Backfilled missing display names for existing users using deterministic email-derived values.
- Test/spec coverage added or modified:
  - Added Cypress spec `cypress/e2e/registration.cy.ts` for login-to-register navigation, successful auto-login registration, and duplicate-email rejection.
  - Added page object `cypress/pages/RegisterPage.ts` for reusable registration selectors/actions.
  - Added behavior source spec `specs/registration.feature`.
- Docs/script updates needed to support the change:
  - Updated `README.md` frontend capability list and API notes for new registration endpoint and extended login payload.
  - Added final-pass workflow helper enforcement docs for review artifact requirements.
  - Added `.env.example` optional overrides for demo/test password and review artifact path.
- Security hardening updates applied after implementation:
  - Password handling moved to hashed-at-rest flow (bcrypt) for seeded users and new registrations.
  - Legacy/plaintext user passwords are migrated to hashed values during DB initialization.
  - `GET /api/help` no longer returns user passwords; it now exposes only demo user email/role guidance.

## Phase Timeline

- 2026-03-11T14:55:20Z | Timeline | Initialized (backfilled to support phase tracking across clarification, analysis, implementation, testing, and review).
