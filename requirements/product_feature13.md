As store Product Owner, I would like to:
1. Turn the Image and "Happy Vibes" area in the header into a link to navigate back to the store catalog view.
2. Please implement this link in all the pages and make the link available only if I am a logged in/authenticated user.
3. Avoid unauthorized users seeing and being able to click on the hyperlink to take them to the store catalog.

## Clarification Decisions

### Decisions Applied

1. "All pages" applies to all routes where the shared authenticated header is shown.
2. The clickable link target is `/store` (catalog route).
3. The link is enabled only for authenticated sessions.
4. For unauthenticated screens, the brand area remains visible as non-link text/icon only.
5. Unauthorized users must not have any clickable brand control that navigates to `/store`.

### Requirements Updates

1. In authenticated header contexts, the `Happy Vibes` brand area (icon + text) must be a clickable link/button that navigates to `/store`.
2. The brand link behavior must be consistent across all authenticated pages using the shared header.
3. In unauthenticated contexts (for example login/register/help screens), the brand area must not render as a clickable link to `/store`.
4. This change must not alter existing auth route guards (unauthenticated access to `/store` remains blocked/redirected by existing logic).
5. Existing header actions (store, checkout, help, account menu/logout) must continue to behave unchanged.

### Acceptance Criteria Updates

1. Given an authenticated user on any page with the shared app header, clicking the `Happy Vibes` brand area navigates to `/store`.
2. Given an authenticated user already on `/store`, clicking the brand area keeps the user on `/store` (no error/regression).
3. Given an unauthenticated user on login/register/help pages, the brand area is visible but not clickable as a link to `/store`.
4. Given an unauthenticated user, no interactive brand element is available that routes to `/store`.
5. Existing auth enforcement and navigation behavior remain unchanged after this update.

### Blocking Questions

1. None.

### Status

Ready for analysis

## Technical Analysis

### Current State Observations

1. The authenticated app shell renders `AppHeader` globally in `app/frontend/src/App.jsx` whenever a session token exists.
2. In `app/frontend/src/components/AppHeader.jsx`, the `Happy Vibes` brand area is currently a non-interactive `Typography` block with icon/text and no click handler.
3. Existing authenticated navigation already has a `Store` button (`data-cy="nav-store"`) using `onGoStore`, so the route intent (`/store`) is already centralized.
4. Unauthenticated pages (`LoginScreen`, `RegisterScreen`, unauth Help) render their own simple branded headers (`data-cy="unauth-store-title`) that are currently non-link and should remain non-link.
5. Existing auth route-guard logic in `App.jsx` already blocks unauthenticated access to `/store`; this behavior should remain unchanged.

### Architecture Decision

Implement brand-link behavior only in `AppHeader` (authenticated shell) by converting the brand area into an explicit button-like control that invokes `onGoStore`.

Why this approach:

1. It satisfies "all pages" for authenticated users in one shared component change.
2. It avoids touching unauthenticated screen components where the link must remain unavailable.
3. It reuses existing navigation intent (`onGoStore`) and avoids route duplication.
4. It minimizes regression risk by not altering auth guards, route tables, or page-level layouts.

### Risk and Regression Considerations

1. **Low UX risk:** duplicate store navigation affordance (`brand` + `Store` button) is intentional and acceptable.
2. **Low accessibility risk:** clickable brand control needs explicit accessible button/link semantics and keyboard operability.
3. **Low functional risk:** no backend/API changes; frontend-only header interaction.
4. **Mitigation:** add/extend Cypress assertions for authenticated brand click navigation and unauth non-link behavior.

## Implementation Plan

### Files to Modify

1. `app/frontend/src/components/AppHeader.jsx`
   - Convert `Happy Vibes` brand region into an interactive control (button/link-style) with stable selector (for example `data-cy="nav-brand-store"`).
   - Wire interaction to existing `onGoStore` callback.
   - Preserve icon/text styling and layout consistency.
2. `cypress/e2e/help.cy.ts`
   - Extend authenticated help-navigation scenario to assert brand click returns to `/store`.
   - Keep assertion that unauthenticated help shows only non-link simplified brand.
3. `cypress/e2e/login.cy.ts` (or registration/help specs as needed)
   - Add/adjust assertion that unauthenticated brand (`data-cy="unauth-store-title"`) is not an interactive `/store` control.
4. `requirements/product_feature13.md`
   - After implementation: update `## What Changed`, `## Verification Results`, and `## Review Results`.

### Build Sequence

1. Make `AppHeader` brand area interactive for authenticated users.
2. Add/adjust Cypress tests for:
   - authenticated brand-to-store navigation,
   - unauthenticated non-link brand behavior.
3. Run verification:
   - `npm run test:e2e`
   - `npm run test:a11y`
   - `npm run workflow:final-pass` (with `REQUIREMENTS_REVIEW_PATH=requirements/product_feature13.md` if needed).
4. Update requirements artifact sections and append timeline entries for implementation/testing/review phases.

## Test Strategy

### Primary Validation (Required)

1. Authenticated user:
   - From `/help` (authenticated header visible), click brand area and confirm navigation to `/store`.
2. Authenticated user on `/store`:
   - Clicking brand area keeps user on `/store` without errors.
3. Unauthenticated user:
   - On login/register/help, confirm brand area remains visible but non-interactive as `/store` navigation control.
4. Ensure no regression in existing header actions (`Store`, `Checkout`, `Help`, account menu/logout).

### Regression Coverage

1. Run full E2E suite (`npm run test:e2e`) to confirm no cross-feature nav regressions.
2. Run accessibility suite (`npm run test:a11y`) to ensure clickable brand control and unauth states remain WCAG-safe.

## Phase Timeline

- 2026-03-11T15:15:36Z | Clarification | Started | Initial requirement captured and ambiguity review started.
- 2026-03-11T15:15:36Z | Clarification | Completed | Decisions, requirements updates, and acceptance criteria finalized.
- 2026-03-11T15:17:12Z | Analysis | Started | Reviewed header ownership, auth route guards, and existing Cypress coverage.
- 2026-03-11T15:17:12Z | Analysis | Completed | Technical analysis, implementation plan, and test strategy documented.
- 2026-03-11T15:19:04Z | Implementation | Started | Began authenticated brand-link update in shared header and Cypress coverage updates.
- 2026-03-11T15:24:18Z | Implementation | Completed | Authenticated header brand now routes to `/store`; unauthenticated pages remain non-link.
- 2026-03-11T15:19:04Z | Testing | Started | Running E2E, accessibility, and final-pass validation on isolated ports.
- 2026-03-11T15:24:18Z | Testing | Completed | `test:e2e`, `test:a11y`, and `workflow:final-pass` passed.
- 2026-03-11T15:24:30Z | Review | Completed | No blocking findings; ready for handoff.

## What Changed

- Frontend/UI updates shipped:
  - Updated `app/frontend/src/components/AppHeader.jsx` so the authenticated brand area (storefront icon + `Happy Vibes`) is now an interactive control (`data-cy="nav-brand-store"`) that invokes existing `onGoStore` navigation to `/store`.
  - Preserved unauthenticated header behavior (login/register/help simple brand remains non-link and has no `/store` brand control).
- Backend/API impact:
  - None.
- Test/spec changes:
  - Updated `cypress/e2e/help.cy.ts` to assert:
    - unauthenticated help has no `nav-brand-store`,
    - authenticated help has `nav-brand-store` and clicking it navigates to `/store`.
  - Updated `cypress/e2e/login.cy.ts` to assert unauthenticated login page has no `nav-brand-store`.

## Verification Results

- `BACKEND_PORT=4316 FRONTEND_PORT=5216 npm run test:e2e`
  - Result: pass (40 tests passing; PDF generated at `reports/cypress-report-20260311-101941.pdf`).
- `BACKEND_PORT=4316 FRONTEND_PORT=5216 npm run test:a11y`
  - Result: pass (5 tests passing in `cypress/e2e/accessibility.cy.ts`).
- `BACKEND_PORT=4316 FRONTEND_PORT=5216 REQUIREMENTS_REVIEW_PATH=requirements/product_feature13.md npm run workflow:final-pass`
  - Result: pass (final pass complete; requirements artifact resolved to `requirements/product_feature13.md`, PDF generated at `reports/cypress-report-20260311-102158.pdf`).

## Review Results

- Review scope:
  - `app/frontend/src/components/AppHeader.jsx`, `cypress/e2e/help.cy.ts`, `cypress/e2e/login.cy.ts`.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/app/frontend/src/components`: `issueCount: 0`.
- Final status: Ready for handoff.
