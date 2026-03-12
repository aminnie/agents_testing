As the store Product Owner I would like to add an address to every user that can be used for product billing and shipping.

The requirements are:
1. Add the following address details to every user record:
   1.1. Street (50 characters max)
   1.2. City (30 characters max)
   1.3. Zip/Postal Code (digits and '-' only, up to 15 characters max)
   1.4. Country (30 characters max)
2. Add the address to the database table(s).
3. Add address input and edit to the following screens:
   3.1. User registration (required to provide all address fields)
   3.2. User edit
   3.3. Checkout

## Clarification Decisions

### Decisions Applied

1. A single user profile address is in scope (not separate billing/shipping addresses).
2. The address is composed of four fields stored on the user record:
   - `street` (required, max 50 chars),
   - `city` (required, max 30 chars),
   - `postalCode` (required, digits and `-` only, max 15 chars),
   - `country` (required, max 30 chars).
3. Field values are stored and compared as trimmed strings (leading/trailing whitespace removed before validation and persistence).
4. Empty strings after trimming are invalid for all four address fields.
5. `postalCode` validation pattern is `^[0-9-]{1,15}$`.
6. Registration requires all address fields before account creation succeeds.
7. User edit allows viewing/updating all address fields and persisting them to the user profile.
8. Checkout must prefill address fields from the logged-in user profile and allow edits before submit.
9. Checkout submit must fail validation if any address field is invalid.
10. Address edits made during checkout must persist back to the user profile when checkout succeeds.
11. Existing authorization and access rules remain unchanged (user can edit only their own profile data through allowed UI paths; admin behavior remains governed by existing controls).
12. Out of scope:
    - separate billing and shipping addresses,
    - address history/versioning,
    - geocoding or third-party address validation services.

### Requirements Updates

1. Extend the user data model and persistence layer to store `street`, `city`, `postalCode`, and `country` on each user profile.
2. Registration UI/API must capture all four address fields as required inputs, apply trim + validation rules, and block account creation on validation failure.
3. User edit UI/API must retrieve and update all four address fields with the same validation constraints used in registration.
4. Checkout UI/API must prefill address fields from the current user profile by default and allow edits before submission.
5. Checkout submission must validate address fields and reject invalid payloads with deterministic field-level error responses.
6. On successful checkout, edited address values must be saved to the user profile for future reuse.
7. Validation behavior must be consistent across frontend and backend (same required fields, length limits, and postal code format).
8. Existing behavior outside address handling (authentication, authorization, and non-address checkout flow) must remain unchanged.

### Acceptance Criteria Updates

1. Given registration, when any address field is missing, empty after trim, too long, or `postalCode` fails `^[0-9-]{1,15}$`, then account creation is blocked and field-level validation feedback is shown.
2. Given registration with valid address fields, when account creation succeeds, then the persisted user profile contains the same trimmed values for `street`, `city`, `postalCode`, and `country`.
3. Given user edit, when a user submits valid address updates, then the updates persist and are visible after page reload and a new authenticated session.
4. Given user edit, when invalid address values are submitted, then persistence is blocked and deterministic field-level validation feedback is shown.
5. Given checkout for an authenticated user with an existing profile address, when checkout loads, then all address fields are pre-populated from the profile.
6. Given checkout, when any address value is invalid at submit time, then order submission is blocked and deterministic validation feedback is shown.
7. Given checkout, when valid edited address values are submitted and checkout succeeds, then the new values are persisted to the user profile and reused on later checkout and user-edit visits.
8. Given unrelated auth and non-address checkout behavior, when this feature is released, then existing behavior remains unchanged.

### Blocking Questions

1. None.

### Status

Completed (superseded by Technical Analysis status below)

## Technical Analysis

### Current State Observations

1. Backend schema currently stores user identity/role fields but no address fields; schema evolution uses migration-safe `PRAGMA table_info(...)` + conditional `ALTER TABLE` in `app/backend/src/db.js`.
2. Registration (`POST /api/register`) persists only `displayName`, `email`, and `password`; login and admin-user payload projections do not include address fields in `app/backend/src/server.js`.
3. Checkout (`POST /api/checkout`) validates cart/payment only and does not accept or persist address data in `app/backend/src/server.js`.
4. Frontend registration and checkout forms are implemented in `app/frontend/src/components/RegisterScreen.jsx`, `app/frontend/src/components/CheckoutPage.jsx`, with state + API integration in `app/frontend/src/App.jsx`.
5. The current "user edit" UI path is admin-managed (`/admin/users/:userId/edit`) in `app/frontend/src/components/UserEditPage.jsx`, backed by `/api/admin/users/:id` GET/PUT in `app/backend/src/server.js`.
6. Cypress coverage already exists for registration, checkout, and admin user edit with page-object patterns in:
   - `cypress/e2e/registration.cy.ts`, `cypress/pages/RegisterPage.ts`
   - `cypress/e2e/checkout.cy.ts`, `cypress/pages/CheckoutPage.ts`
   - `cypress/e2e/admin-user-management.cy.ts`, `cypress/pages/UserEditPage.ts`
7. Accessibility baseline tests include checkout and admin-user-edit routes in `cypress/e2e/accessibility.cy.ts`; new form fields must preserve current WCAG checks.

### Architecture Decision

Implement address as profile-level user attributes (`street`, `city`, `postalCode`, `country`) stored on the `users` table and reused across registration, user edit, and checkout.

Rationale:
1. Reuses existing user-centric data model and avoids introducing a second address table for a single-address scope.
2. Keeps checkout deterministic by preloading from profile and persisting edits back to the same source of truth.
3. Aligns with current app architecture (single backend API file and centralized app state in `App.jsx`) for lowest-risk incremental delivery.

Trade-offs:
1. Storing address directly on `users` is simple but less flexible for future multi-address features.
2. Validation logic must be kept synchronized across frontend/backend without a shared runtime validation package.
3. Existing users without address data require migration/backfill handling until each profile is updated.

### API and Data Contract Impact

1. Database:
   - Add nullable columns on `users`: `street`, `city`, `postal_code`, `country` in `app/backend/src/db.js` via migration-safe conditional `ALTER TABLE`.
2. API response shape updates:
   - Include `street`, `city`, `postalCode`, `country` in `POST /api/login` response user object.
   - Include same address fields in `POST /api/register` response user object.
   - Include same address fields in admin user detail/list where applicable (`GET /api/admin/users`, `GET /api/admin/users/:id`, `PUT /api/admin/users/:id` response).
3. API request shape updates:
   - `POST /api/register` requires address fields.
   - `PUT /api/admin/users/:id` accepts address fields alongside current email/displayName/role updates.
   - `POST /api/checkout` accepts an `address` object and validates it before order creation.
4. Validation contract:
   - `street`: required, trimmed, 1..50 chars.
   - `city`: required, trimmed, 1..30 chars.
   - `postalCode`: required, trimmed, regex `^[0-9-]{1,15}$`.
   - `country`: required, trimmed, 1..30 chars.
5. Compatibility notes:
   - Existing clients that do not send checkout address will fail checkout validation after rollout; frontend checkout update is a required paired release.
   - Existing users can still log in; they will be prompted by validation when trying to register/edit/checkout with missing or invalid address fields.

### UI/UX and Permission Impact

1. Registration page must add required address inputs and prevent submit on invalid values.
2. User edit page must expose/edit all four address fields with existing admin edit controls and current role-based access.
3. Checkout page must:
   - prefill address from logged-in profile,
   - allow editing before submit,
   - block submit with deterministic validation errors,
   - persist successful edits back to profile.
4. Authorization remains unchanged:
   - admin-only access for `/admin/users` management path,
   - authenticated users can update their own saved address via successful checkout (profile persistence side effect).

### Data Flow Overview

1. Registration flow:
   - UI (`RegisterScreen.jsx`) captures address -> `App.jsx` normalizes and submits -> backend validates -> inserts user row -> returns user with address -> frontend persists in local storage.
2. Admin user edit flow:
   - UI (`UserEditPage.jsx`) loads user -> edits address + identity/role -> backend validates and updates -> updated user response rebinds form state.
3. Checkout flow:
   - UI (`CheckoutPage.jsx`) initializes from `currentUser` profile in `App.jsx` -> submit includes `items`, `payment`, `address` -> backend validates and writes order -> backend updates `users` address -> frontend updates local `currentUser`.

### Risk and Regression Considerations

1. Risk: validation drift between frontend/backend.
   - Mitigation: define single address rule constants per layer and mirror tests for both validation boundaries.
2. Risk: query projection mismatch (some endpoints returning stale user shape).
   - Mitigation: update and verify all user-mapping projections in `server.js` together.
3. Risk: migration issues on existing SQLite files.
   - Mitigation: use idempotent `PRAGMA` checks before adding columns; avoid destructive schema rebuilds.
4. Risk: Cypress brittleness from selector changes.
   - Mitigation: add new stable `data-cy` selectors and update page objects before spec updates.
5. Risk: accessibility regressions from new inputs.
   - Mitigation: keep explicit labels/ids and run `npm run test:a11y`.

### Blocking Questions

1. None.

### Status

Implemented and verified

## Implementation Plan

### Files to Modify

1. `app/backend/src/db.js`
   - Add migration-safe address columns to `users` table.
2. `app/backend/src/server.js`
   - Add shared address normalize/validate helpers.
   - Extend register/login/admin-user query projections and payloads with address.
   - Extend checkout input contract to require/validate address and persist address updates to user profile on successful order.
3. `app/frontend/src/App.jsx`
   - Add registration/checkout address state, client validation, submit payload updates, prefill from `currentUser`, and post-checkout user-state refresh.
4. `app/frontend/src/components/RegisterScreen.jsx`
   - Add required address form controls with stable `data-cy` selectors.
5. `app/frontend/src/components/UserEditPage.jsx`
   - Add editable address controls, client validation, and request payload fields.
6. `app/frontend/src/components/CheckoutPage.jsx`
   - Add address section + inputs and wire handlers/values.
7. `cypress/pages/RegisterPage.ts`
   - Add address field selectors and helper updates.
8. `cypress/pages/CheckoutPage.ts`
   - Add address field helpers and submission helpers.
9. `cypress/pages/UserEditPage.ts`
   - Add admin user address field selectors.
10. `cypress/e2e/registration.cy.ts`
    - Add positive/negative address validation and payload assertions.
11. `cypress/e2e/checkout.cy.ts`
    - Add prefill, invalid-address blocking, and persistence assertions.
12. `cypress/e2e/admin-user-management.cy.ts`
    - Add save/update assertions for address fields on admin edit.
13. `specs/registration.feature`
    - Add address scenarios (required, invalid postal code, success persistence).
14. `specs/checkout.feature`
    - Add address prefill/edit/validation scenarios.
15. `specs/admin-user-management.feature`
    - Add admin address edit behavior scenario.
16. `requirements/feature_15.md`
    - Update `## What Changed`, `## Verification Results`, and `## Review Results` after implementation/testing/review.

### Build Sequence

1. Add backend schema migration + address validation helpers.
2. Update backend user/checkout endpoints and response mappings.
3. Update frontend registration form/state/payload.
4. Update frontend admin user edit address handling.
5. Update checkout prefill/edit/submit behavior and local user persistence.
6. Update Cypress page objects first, then E2E specs.
7. Update `specs/*.feature` documents for address coverage.
8. Run verification commands and finalize requirement artifact sections.

### Completion Criteria

1. Address fields are persisted and retrievable on user records.
2. Registration, user edit, and checkout enforce the same validation constraints.
3. Checkout prefill + successful persistence back to profile is demonstrably working.
4. Cypress and final-pass workflow checks pass.

## Test Strategy

### Primary Validation (Required)

1. Backend API validation tests via Cypress intercept assertions for register/edit/checkout payloads and status codes.
2. Registration E2E:
   - rejects missing/invalid address input,
   - accepts valid address and auto-login persists profile shape.
3. Admin user edit E2E:
   - loads existing address,
   - saves valid updates,
   - blocks invalid values with deterministic error text.
4. Checkout E2E:
   - pre-populates address from profile,
   - blocks invalid address submit,
   - persists edited address after successful checkout.

### Cypress Structure and Assets

1. Keep specs focused per workflow (`registration.cy.ts`, `checkout.cy.ts`, `admin-user-management.cy.ts`).
2. Extend page objects instead of inline selectors for new inputs.
3. Use `data-cy` selectors for all added address fields and validation messages.
4. Reuse deterministic fixture users where possible; avoid arbitrary waits.

### Accessibility Impact

1. Ensure newly added address fields have proper label associations and keyboard navigation support.
2. Validate no regressions in `cypress/e2e/accessibility.cy.ts`, especially checkout and admin edit scopes.

### Verification Commands

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass`

## What Changed

- Backend/API updates shipped:
  - Added user address persistence support in `app/backend/src/db.js` via migration-safe `users` columns: `street`, `city`, `postal_code`, `country`.
  - Extended `app/backend/src/server.js` login/register/admin-user payloads to include address fields.
  - Added backend address validation and normalization for registration, admin user updates, and checkout submit.
  - Updated checkout to require validated address payload and persist successful checkout edits back to the user profile.
- Frontend/UI behavior changed:
  - Added required address inputs to registration in `app/frontend/src/components/RegisterScreen.jsx` and wired them in `app/frontend/src/App.jsx`.
  - Added address inputs to checkout in `app/frontend/src/components/CheckoutPage.jsx` with client-side validation and payload submission.
  - Added admin user-edit address controls in `app/frontend/src/components/UserEditPage.jsx`.
  - Updated auth/user state handling in `app/frontend/src/App.jsx` so checkout address prefill and post-checkout profile persistence stay synchronized.
- Test/spec coverage updates:
  - Updated Cypress page objects:
    - `cypress/pages/RegisterPage.ts`
    - `cypress/pages/CheckoutPage.ts`
    - `cypress/pages/UserEditPage.ts`
  - Updated Cypress specs:
    - `cypress/e2e/registration.cy.ts`
    - `cypress/e2e/checkout.cy.ts`
    - `cypress/e2e/admin-user-management.cy.ts`
    - `cypress/e2e/catalog-cart.cy.ts`
  - Updated behavior specs:
    - `specs/registration.feature`
    - `specs/checkout.feature`
    - `specs/admin-user-management.feature`
- Docs/workflow support updates:
  - Refreshed this requirements artifact with implementation results, verification outcomes, and review summary for workflow final pass compliance.

## Verification Results

- `npm run test:e2e`
  - Result: pass (45/45 tests). PDF generated at `reports/cypress-report-20260311-121157.pdf`.
- `npm run test:a11y`
  - Result: pass (5/5 tests in `cypress/e2e/accessibility.cy.ts`).
- `REQUIREMENTS_REVIEW_PATH=requirements/feature_15.md npm run workflow:final-pass`
  - Result: pass. Final-pass completed with `requirements/feature_15.md`.
- `snyk_code_scan` on `/Users/anton.minnie/agents_testing`
  - Result: pass (`issueCount: 0`) after remediating one medium hardcoded-password finding in a modified Cypress spec.

## Review Results

- Review scope:
  - Backend: address schema migration and API validation/persistence.
  - Frontend: registration, admin user edit, checkout address capture/prefill/persistence.
  - Tests/specs: Cypress page objects/specs and `specs/*.feature` updates.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Residual risk notes:
  - Existing local processes on ports 4000/5173 caused expected `EADDRINUSE` log noise during script startup, but verification commands still completed successfully against reachable services.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-11T16:48:57Z | Clarification | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed original feature text and identified missing constraints around address lifecycle and checkout persistence.
- 2026-03-11T16:48:57Z | Clarification | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Converted ambiguous address requirements into explicit, testable decisions and acceptance criteria.
- 2026-03-11T16:49:55Z | Clarification | Updated | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Tightened validation semantics (trim, empty-string handling, explicit postal code regex), added out-of-scope boundaries, and made acceptance criteria more deterministic for test automation.
- 2026-03-11T16:52:36Z | Analysis | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Analyzed backend/frontend/test architecture and mapped address feature impact across registration, user edit, and checkout flows.
- 2026-03-11T16:53:29Z | Analysis | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized architecture decision, implementation sequence, and test/verification strategy for address profile integration.
- 2026-03-11T16:58:02Z | Implementation | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started coding backend schema/API updates and frontend/Cypress changes for user address capture, edit, and checkout persistence.
- 2026-03-11T17:10:12Z | Implementation | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed address feature implementation across backend, frontend, and test assets.
- 2026-03-11T16:58:22Z | Testing | Started | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began required verification workflow (`test:e2e`, `test:a11y`, `workflow:final-pass`) and iterated on failing tests until green.
- 2026-03-11T17:17:08Z | Testing | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Re-ran required verification commands after security remediation; all commands passed.
- 2026-03-11T17:17:15Z | Review | Completed | model=default-agent-model | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed final review including Snyk scan verification and updated requirements artifact evidence.

