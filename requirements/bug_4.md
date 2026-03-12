We have a bug in the Help page:

1. When we are logged in the Help page presents our standatd header same as e.g. the catalog page.
1.1. However in this scenario the a second header is also displayed below and this is incorrect.
2. When we are not logged in yet, only the simpler header is displayed which is correct.
3. We have to decide which header we display on the Help page.

## Clarification Decisions

### Decisions Applied

1. The Help page must show exactly one header at a time.
2. Logged-in users must see the standard authenticated app header (same one used on catalog/store pages).
3. Logged-out users must see the simplified unauthenticated header only.
4. The simplified header must never render for authenticated sessions.
5. The authenticated header must never render for unauthenticated sessions.

### Requirements Updates

1. On `/help`, header rendering must be auth-state driven and mutually exclusive.
2. If a valid authenticated session exists, render only the standard authenticated header.
3. If no authenticated session exists, render only the simplified unauthenticated header.
4. The Help content area (`Help` title, navigation tips, and error/loading behavior) must remain unchanged.
5. Existing help navigation actions (from login and from authenticated navigation) must continue to work.

### Acceptance Criteria Updates

1. Given an authenticated user on `/help`, exactly one header is visible and it matches the catalog/store header style and controls.
2. Given an authenticated user on `/help`, no secondary simplified header is displayed.
3. Given an unauthenticated user on `/help`, exactly one simplified header is visible.
4. Given an unauthenticated user on `/help`, no authenticated app header is displayed.
5. Help page loading, error, and content states continue to render correctly with no behavior regressions.

### Blocking Questions

1. None.

### Status

Ready for analysis

## Technical Analysis

### Current State Observations

1. `App.jsx` renders `<AppHeader />` globally for authenticated sessions, including while routed to `/help`.
2. `HelpPage.jsx` currently renders its own branded `AppBar` header unconditionally.
3. Result: authenticated `/help` shows two headers (global authenticated header + HelpPage local header).
4. Unauthenticated `/help` is correct because no global `<AppHeader />` is present and HelpPage renders only the simplified header.
5. Help page data/loading/error behavior is encapsulated in `HelpPage.jsx` and is independent from top-level auth header state.

### Architecture Decision

Use route-context-driven header ownership:

1. Authenticated `/help` relies on global `<AppHeader />` from `App.jsx` only.
2. Unauthenticated `/help` keeps the simplified branded header rendered by `HelpPage.jsx`.
3. Introduce an explicit prop on `HelpPage` to control simplified header visibility (for example `showSimpleHeader`), instead of inferring from `onBack` or route string.

This is the smallest safe change because it preserves existing shared authenticated layout behavior and only gates local HelpPage header rendering.

### Risk and Regression Considerations

1. **Low UI risk:** accidental removal of all headers on one auth path if header visibility gating is miswired.
2. **Low functional risk:** help content fetch and state handling should remain untouched.
3. **Mitigation:** validate both auth states in Cypress (`/help` from login and `/help` from authenticated header) and assert header count/visibility behavior.

## Implementation Plan

### Files to Modify

1. `app/frontend/src/App.jsx`
   - Update `/help` route elements to pass explicit header intent:
     - unauthenticated help route -> `showSimpleHeader={true}`
     - authenticated help route -> `showSimpleHeader={false}`
2. `app/frontend/src/components/HelpPage.jsx`
   - Add `showSimpleHeader` prop.
   - Render simplified app-bar header only when `showSimpleHeader` is true.
   - Keep current loading/error/content rendering logic unchanged.
3. `cypress/e2e/help.cy.ts`
   - Add/update assertions to ensure:
     - unauthenticated `/help` shows simplified header.
     - authenticated `/help` does not show simplified header (only global authenticated header remains).
4. `requirements/bug_4.md`
   - Update `## What Changed`, `## Verification Results`, and `## Review Results` after implementation.

### Build Sequence

1. Add `showSimpleHeader` prop contract to `HelpPage`.
2. Wire both `/help` routes in `App.jsx` with explicit header mode.
3. Update/extend help Cypress assertions for auth and unauth header behavior.
4. Run `npm run test:e2e`.
5. Run `npm run test:a11y`.
6. Update this requirements file with delivered change details and verification output.

## Test Strategy

### Primary Validation (Required)

1. Unauthenticated: visit `/help` directly and verify simplified header appears once.
2. Authenticated: login, navigate to `/help`, verify authenticated header appears and simplified header is absent.
3. Verify `Help` content, loading, and error states continue to work.
4. Verify back navigation from help works in both auth contexts.

### Regression Coverage

1. Run baseline E2E suite (`npm run test:e2e`).
2. Run accessibility checks (`npm run test:a11y`) to ensure header change does not introduce contrast/landmark regressions.

## What Changed

- Frontend/UI updates shipped:
  - Updated `/help` route wiring in `app/frontend/src/App.jsx` to explicitly control simplified Help header rendering by auth state:
    - unauthenticated route uses `showSimpleHeader`
    - authenticated route uses `showSimpleHeader={false}`
  - Updated `app/frontend/src/components/HelpPage.jsx` to accept `showSimpleHeader` and render the simplified branded app-bar only when enabled.
  - Preserved Help page content/loading/error behavior and existing back navigation behavior.
- Backend/API impact:
  - None.
- Test/spec changes:
  - Updated `cypress/e2e/help.cy.ts` to assert mutually exclusive header behavior:
    - unauthenticated `/help` shows simplified header and no authenticated dashboard header,
    - authenticated `/help` shows authenticated dashboard header and no simplified header.

## Verification Results

- `BACKEND_PORT=4315 FRONTEND_PORT=5215 npm run test:e2e`
  - Result: pass (40 tests passing; PDF generated at `reports/cypress-report-20260310-230855.pdf`).
- `BACKEND_PORT=4315 FRONTEND_PORT=5215 npm run test:a11y`
  - Result: pass (5 tests passing in `cypress/e2e/accessibility.cy.ts`).

## Review Results

- Review scope:
  - `app/frontend/src/App.jsx`, `app/frontend/src/components/HelpPage.jsx`, `cypress/e2e/help.cy.ts`.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/app/frontend/src`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-11T14:55:20Z | Timeline | Initialized (backfilled to support phase tracking across clarification, analysis, implementation, testing, and review).