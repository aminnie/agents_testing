# Jira Source: SCRUM-26

- Summary: Store: Rename the Store
- Jira Type: Story
- Jira Status: To Do

## Original Jira Description

As the store Product Owner, I would like to rename the store title to “Good Vibes” from the current title of “Happy Vibes”

1. Please find all references to “Happy Vibes” or “Mini Store” and replace them with “Good Vibes”

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-26
- Source summary: Rename store branding from "Happy Vibes" and "Mini Store" to "Good Vibes" across active application surfaces.

As a Product Owner, I would like to:
1. See a consistent store name of "Good Vibes" in the application.
2. Remove legacy branding labels "Happy Vibes" and "Mini Store" from active product surfaces.
3. Ensure tests and documentation reflect the updated store branding.

## Clarification Decisions

### Decisions Applied

1. The canonical product name is "Good Vibes" and must be used consistently in active user-facing UI text.
2. Existing references to "Happy Vibes" and "Mini Store" are treated as legacy branding and must be replaced where they are part of current behavior, seeded content, or test expectations.
3. Historical artifacts (for example completed requirement history text) are not rewritten retroactively unless they are part of current runtime behavior or active automation assertions.

### Requirements Updates

1. Update frontend and backend surfaced branding strings so the application title/name displayed to users is "Good Vibes".
2. Update any API/help payload or seeded copy that currently returns "Happy Vibes" or "Mini Store" as the active store name.
3. Update end-to-end and accessibility artifacts (spec text, Cypress assertions/page objects) when they assert old branding values.
4. Update primary operator/developer documentation where project name references describe the running store product branding.
5. Do not change unrelated prose/history in prior completed requirement logs unless the text is actively consumed by runtime code or automated tests.

### Acceptance Criteria Updates

1. On standard user startup, the visible store title/name in core navigation or landing surfaces is "Good Vibes".
2. A repository search for exact phrases "Happy Vibes" and "Mini Store" shows no matches in active runtime source files under `app/` and no matches in active Cypress assertions/specs under `cypress/` and `specs/` related to current behavior.
3. `npm run test:e2e` passes after branding updates, confirming user-visible workflows remain stable.
4. `npm run test:a11y` passes after branding updates, confirming no accessibility regression from text/label changes.
5. `REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-26.md npm run workflow:final-pass` passes before handoff.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Brand text is hardcoded in multiple frontend surfaces:
   - Authenticated header: `app/frontend/src/components/AppHeader.jsx` (`Happy Vibes`)
   - Unauthenticated headers: `app/frontend/src/components/LoginScreen.jsx`, `app/frontend/src/components/RegisterScreen.jsx`, `app/frontend/src/components/HelpPage.jsx` (`Happy Vibes`)
   - Browser tab title: `app/frontend/index.html` (`Mini Store`)
2. Existing Cypress coverage directly asserts legacy branding strings:
   - `cypress/e2e/login.cy.ts`
   - `cypress/e2e/help.cy.ts`
   - `cypress/e2e/registration.cy.ts`
   - `specs/login.feature`
3. Backend source under `app/backend/` currently has no direct `Happy Vibes` or `Mini Store` string usage, so this is primarily a frontend/test/docs text replacement scope.
4. Stable selectors for title assertions already exist (`data-cy="unauth-store-title"`, `data-cy="dashboard-title"`), so the change can remain text-only without selector churn.

### Architecture Decision

Use a scoped string replacement approach focused on active product/runtime surfaces and active test assertions, without introducing new configuration abstractions.

Rationale:
- This story is a naming-only behavior change with no business-logic or API contract redesign.
- Existing components already centralize visible title points; direct replacement is low-risk and reversible.
- Avoiding over-engineering (for example, a new branding config layer) keeps scope aligned with SCRUM-26.

Trade-offs:
- Pros: minimal code change set, low regression surface, fast validation.
- Cons: branding string remains duplicated across components; a future shared constant can be introduced if rebranding becomes recurring.

API/data contract impact:
- No backend API shape/status code changes.
- No schema/migration impact.
- Full backward compatibility maintained.

### Risk and Regression Considerations

1. Risk: Partial replacement leaves mixed branding in user-visible flows.
   - Mitigation: Run targeted string search and update all active runtime/test files in one batch.
2. Risk: Cypress and spec assertions fail if expected text is not synchronized.
   - Mitigation: Update all matching assertions and feature text before running test suites.
3. Risk: Accidental edits in historical requirement artifacts create noisy unrelated diffs.
   - Mitigation: Limit implementation scope to runtime code, active tests/specs, and primary docs only.
4. Risk: Accessibility regressions from text updates (unlikely but still a required gate).
   - Mitigation: Run `npm run test:a11y` as part of required verification.

## Implementation Plan

### Files to Modify

1. `app/frontend/src/components/AppHeader.jsx`
   - Replace authenticated header title text from `Happy Vibes` to `Good Vibes`.
2. `app/frontend/src/components/LoginScreen.jsx`
   - Replace unauthenticated title text from `Happy Vibes` to `Good Vibes`.
3. `app/frontend/src/components/RegisterScreen.jsx`
   - Replace unauthenticated title text from `Happy Vibes` to `Good Vibes`.
4. `app/frontend/src/components/HelpPage.jsx`
   - Replace unauthenticated help header title text from `Happy Vibes` to `Good Vibes`.
5. `app/frontend/index.html`
   - Replace browser tab title from `Mini Store` to `Good Vibes`.
6. `cypress/e2e/login.cy.ts`
   - Update branding expectation from `Happy Vibes` to `Good Vibes`.
7. `cypress/e2e/help.cy.ts`
   - Update branding expectation from `Happy Vibes` to `Good Vibes`.
8. `cypress/e2e/registration.cy.ts`
   - Update branding expectation from `Happy Vibes` to `Good Vibes`.
9. `specs/login.feature`
   - Update visible branding expectation lines from `Happy Vibes` to `Good Vibes`.
10. `README.md`
   - Update project branding text where it describes the active store product name.
11. `requirements/feature_SCRUM-26.md`
   - Record delivered implementation, verification evidence, review outcome, and timeline updates.

### Build Sequence

1. Replace frontend branding strings in runtime UI files.
2. Replace corresponding Cypress/spec assertions.
3. Update README branding references scoped to active product naming.
4. Run targeted repository search to confirm legacy phrases are removed from active runtime/test surfaces.
5. Execute required verification suite:
   - `npm run test:e2e`
   - `npm run test:a11y`
   - `REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-26.md npm run workflow:final-pass`
6. Record implementation outcomes and verification evidence in this requirements file.

## Test Strategy

### Primary Validation (Required)

1. UI smoke check:
   - Verify visible title is `Good Vibes` on login (`/`), register (`/register`), help (`/help`), and authenticated header (`/store`).
2. Browser metadata check:
   - Verify tab title resolves to `Good Vibes`.
3. Search-based scope check:
   - Confirm no `Happy Vibes` / `Mini Store` in active runtime source (`app/`) and active Cypress/spec assertions (`cypress/`, `specs/`) for current behavior.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-26.md npm run workflow:final-pass`
4. Optional focused suite during implementation:
   - `npm run cypress:run -- --spec cypress/e2e/login.cy.ts,cypress/e2e/help.cy.ts,cypress/e2e/registration.cy.ts`

## What Changed

- Frontend/UI updates shipped:
  - Updated visible store branding from `Happy Vibes` to `Good Vibes` in authenticated and unauthenticated headers:
    - `app/frontend/src/components/AppHeader.jsx`
    - `app/frontend/src/components/LoginScreen.jsx`
    - `app/frontend/src/components/RegisterScreen.jsx`
    - `app/frontend/src/components/HelpPage.jsx`
  - Updated browser tab title from `Mini Store` to `Good Vibes` in `app/frontend/index.html`.
- Backend/API impact:
  - No backend code or API contract changes were required for SCRUM-26.
- Test/spec changes:
  - Updated branding expectations from `Happy Vibes` to `Good Vibes` in:
    - `cypress/e2e/login.cy.ts`
    - `cypress/e2e/help.cy.ts`
    - `cypress/e2e/registration.cy.ts`
    - `specs/login.feature`
- Documentation updates:
  - Updated repository heading branding in `README.md` to `Good Vibes Agents Development Initiative`.

## Verification Results

- `rg "Happy Vibes|Mini Store" app cypress specs`
  - Result: pass. No matches found in active runtime/test/spec scope.
- `BACKEND_PORT=4420 FRONTEND_PORT=5196 npm run test:e2e`
  - Result: pass. All specs passed (`57/57`).
- `BACKEND_PORT=4421 FRONTEND_PORT=5197 npm run test:a11y`
  - Result: pass. Accessibility suite passed (`5/5`).
- `BACKEND_PORT=4422 FRONTEND_PORT=5198 REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-26.md npm run workflow:final-pass:ci`
  - Result: pass. Final pass completed in CI mode.
- `BACKEND_PORT=4423 FRONTEND_PORT=5199 REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-26.md JIRA_FINAL_PASS_PUBLISH=false npm run workflow:final-pass`
  - Result: expected fail due Jira publish guardrail (`JIRA_FINAL_PASS_PUBLISH` must be `true` when Jira credentials are configured).
- `BACKEND_PORT=4424 FRONTEND_PORT=5200 REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-26.md JIRA_ISSUE_KEY=SCRUM-26 JIRA_FINAL_PASS_PUBLISH=true JIRA_FINAL_PASS_APPROVED=no npm run workflow:final-pass`
  - Result: pass. Final pass completed with Jira publish dry-run (`jira:publish-final --dry-run true`), no Jira write executed.

## Review Results

- Review scope:
  - `app/frontend/src/components/AppHeader.jsx`
  - `app/frontend/src/components/LoginScreen.jsx`
  - `app/frontend/src/components/RegisterScreen.jsx`
  - `app/frontend/src/components/HelpPage.jsx`
  - `app/frontend/index.html`
  - `cypress/e2e/login.cy.ts`
  - `cypress/e2e/help.cy.ts`
  - `cypress/e2e/registration.cy.ts`
  - `specs/login.feature`
  - `README.md`
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `app/frontend/src`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-15T18:08:11Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Parsed Jira story intent and identified naming scope across UI, API/help copy, docs, and tests.
- 2026-03-15T18:08:11Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Converted rename request into explicit, testable requirements and acceptance criteria with scope boundaries.
- 2026-03-15T18:09:39Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Mapped legacy-brand references in runtime UI files, Cypress specs, and feature specs.
- 2026-03-15T18:09:39Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized rename implementation blueprint, risk controls, and verification gates.
- 2026-03-15T18:11:45Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started scoped runtime/test/doc branding updates for SCRUM-26.
- 2026-03-15T18:20:18Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed frontend title renames and synchronized Cypress/spec/documentation assertions.
- 2026-03-15T18:20:18Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Executed required regression, accessibility, and final-pass validation commands.
- 2026-03-15T18:27:52Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | test:e2e and test:a11y passed; final-pass:ci passed; non-CI final pass passed in Jira dry-run mode after confirming publish guard behavior.
- 2026-03-15T18:27:52Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed changed scope and completed Snyk code scan with zero new issues.

