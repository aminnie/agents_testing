# Bug 2 Requirements Clarification

## Original Request

As Product Owner of this store, I would like to remove the user listing from the Help page.

Requested outcome:

1. Remove the call to and display of user details on the Help page.

## Clarified Requirements (Finalized)

### Problem Statement

The Help page currently includes demo user listing content that is no longer desired. This creates unnecessary exposure of user account references and is outside intended Help-page scope.

### Goal

Keep Help page focused on non-sensitive guidance (navigation/help text) and remove user-list data dependencies.

### Functional Requirements

1. Help page must no longer render any user listing section.
2. Frontend should stop relying on `demoUsers` payload on Help page.
3. Backend Help API should no longer fetch or return user listing data for this page.
4. Existing Help navigation and loading/error behavior must remain intact.

### API/Behavior Requirements

1. `GET /api/help` continues to return help content used by UI (for example `navigationTips`).
2. Response shape should remove `demoUsers` entirely from API contract.
3. Existing status/error behavior remains deterministic (`200` on success, `500` on server failure).

### Non-Functional Requirements

1. Change should be minimal and backward-safe for current routes/workflows.
2. Cypress coverage for Help page should be updated to remove expectations tied to user listing.
3. Accessibility baseline for Help page should remain passing.

### Out of Scope

1. Broader Help-page redesign.
2. Authentication or authorization model changes.
3. Large Help-page redesign beyond small guidance additions.

## Open Questions Needing Your Decisions

Resolved.

## Decision Finalization

1. `demoUsers` will be removed from `GET /api/help` response (not hidden; removed from contract).
2. Keep current navigation tips and add additional useful guidance tips for store users.

## Finalized Requirements Additions

1. Backend must remove `demoUsers` fetch/query and response payload from Help API.
2. Frontend Help page must remove user-list rendering and rely on guidance-only payload fields.
3. Help-page guidance content should retain existing tips and include additional user-helpful tips.
4. Cypress Help tests must be updated to reflect guidance-only Help content.

## Next Step Gate

Decisions are finalized and Bug 2 is ready for architecture analysis and implementation.

## Technical Analysis

### Current-State Observations

1. Help page UI currently reads `demoUsers` and renders a user-list section.
2. Backend `GET /api/help` currently provides payload fields consumed by Help page.
3. Existing Help tests assert presence of user-related content and will need updates when `demoUsers` is removed.

### Architecture Decision

Apply a minimal, contract-aligned removal of user-list functionality:

1. Remove `demoUsers` from backend Help API response and its data query path.
2. Remove Help page user-list rendering and any UI dependency on `demoUsers`.
3. Keep and expand navigation tips only (guidance-focused Help page).
4. Update Cypress and accessibility checks to match new Help content contract.

### Backend Impact

Target file: `app/backend/src/server.js`

1. In `GET /api/help`, remove user-list query logic and `demoUsers` from response body.
2. Keep deterministic success/error behavior unchanged (`200`/`500`).
3. Add or refine `navigationTips` content with additional practical usage guidance.

### Frontend Impact

Target file: `app/frontend/src/components/HelpPage.jsx`

1. Remove `Demo users` section rendering and related data mapping.
2. Keep Help page title, loading/error handling, back navigation, and navigation tips section.
3. Ensure UI remains stable if `navigationTips` array is empty/missing.

### Test/Spec Impact

1. Update `cypress/e2e/help.cy.ts`:
   - remove assertions expecting user-list/demo-user content,
   - assert guidance content still renders correctly.
2. If needed, refresh `specs` guidance wording where Help behavior is described.
3. Re-run accessibility checks for Help page to ensure no regression from layout/content change.

### Risks and Mitigations

1. **Risk:** stale tests failing on removed user-list expectations.
   - **Mitigation:** update Help Cypress tests in same change set.
2. **Risk:** undocumented API contract drift.
   - **Mitigation:** update README API notes/Help description if it currently references user details.

### Build Sequence (Implementation Checklist)

1. Backend: remove `demoUsers` from Help API response and keep/add navigation tips.
2. Frontend: remove user-list UI from Help page.
3. Tests/specs: update Help E2E assertions and validate accessibility Help check.
4. Docs: update README and this requirements file `## What Changed`.
5. Verification: run relevant Cypress specs and `test:a11y`.

## What Changed

- Backend/API updates shipped:
  - Removed user-list (`demoUsers`) data from `GET /api/help` in `app/backend/src/server.js`.
  - Kept navigation guidance payload and added additional useful tips (including admin user-management guidance).
- Frontend/UI behavior changed:
  - Removed Help page user-list section from `app/frontend/src/components/HelpPage.jsx`.
  - Help page now presents guidance-focused content only.
- Test/spec coverage added or modified:
  - Updated `cypress/e2e/help.cy.ts` to assert no user-list rendering and validate guidance content.
  - Updated `specs/help.feature` to reflect guidance-only Help behavior.
  - Re-ran accessibility suite to ensure Help-page accessibility remains passing.
- Docs/script updates:
  - Updated `README.md` API note for `/api/help` to reflect guidance-only contract.

## Verification Results

Validation was executed after implementation with dedicated backend/frontend startup:

1. Help regression spec:
   - Command: `npm run cypress:run -- --spec cypress/e2e/help.cy.ts`
   - Result: `3 passing`, `0 failing`
2. Accessibility baseline suite:
   - Command: `npm run cypress:run:a11y`
   - Result: `5 passing`, `0 failing`
   - Includes Help-page WCAG check under updated guidance-only content.
