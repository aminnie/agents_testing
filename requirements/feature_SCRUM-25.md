# Jira Source: SCRUM-25

- Summary: Catalog List: Remove Cart Content Block
- Jira Type: Story
- Jira Status: In Progress

## Original Jira Description

As the store product owner, I would like to remove the original cart content block at the bottom of catalog list page as it is now redundant after we placed a cart icon in the menu header.

1. Locate the ‘Cart’ content block at the bottom of the Catalog List page and remove it.
2. Adjust all automated tests affect.

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-25
- Source summary: Remove redundant cart content block from the catalog list page now that cart access is provided through the header icon.

As the store product owner, I would like to:
1. Remove the legacy cart content block rendered at the bottom of the catalog list page.
2. Keep cart access and checkout entry through the header cart icon experience.
3. Update automated tests to reflect the intended page layout and behavior.

## Clarification Decisions

### Decisions Applied

1. Scope is limited to the catalog list page cart content block removal; no new cart or checkout behavior is introduced.
2. Header cart icon remains the single cart entry point and must remain visible/functional for authenticated users.
3. Backend/API behavior is unchanged; only frontend rendering and related automated tests are in scope.

### Requirements Updates

1. Remove the bottom-of-page cart content block from the catalog list page UI.
2. Ensure the catalog list still renders product listing, search, and pagination without layout regressions after cart block removal.
3. Keep cart operations available via header icon and existing checkout page flow.

### Acceptance Criteria Updates

1. Given an authenticated user on the catalog list page, when the page loads, then no legacy cart content block is shown at the bottom of the page.
2. Given an authenticated user, when viewing the header, then the cart icon and cart count remain visible and cart/checkout navigation remains functional.
3. Given the UI update is applied, when automated tests run, then affected Cypress tests are updated and pass without relying on removed cart-block selectors.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. `app/frontend/src/components/StorePage.jsx` still renders a bottom cart card containing `data-cy` selectors `cart-empty`, `cart-list`, `cart-total`, and `go-to-checkout`.
2. Existing Cypress coverage (`catalog-cart.cy.ts`, `checkout.cy.ts`, `orders-*.cy.ts`, `accessibility.cy.ts`) currently interacts with the removed-in-scope cart block selectors and will fail unless migrated to header/cart-icon-driven navigation.
3. Header cart behavior already exists (`nav-cart-icon`, `nav-cart-count`) and is the intended cart entry point according to prior product direction.

### Architecture Decision

Remove the cart content card from `StorePage` and treat checkout entry as header-icon only. Update Cypress tests and page objects to use stable header/cart-icon selectors and checkout page assertions, preserving cart-state behavior while removing redundant UI. This keeps scope frontend-only and avoids backend/API contract changes.

### Risk and Regression Considerations

1. **Risk:** Removing cart card breaks multiple tests that assert `cart-empty`, `cart-total`, and in-page `go-to-checkout`.
2. **Mitigation:** Update page object methods and affected specs to assert `nav-cart-count` state and use `nav-cart-icon` for checkout navigation.
3. **Risk:** User may lose visible cart-state feedback on `/store`.
4. **Mitigation:** Ensure header cart count remains visible and accurate before/after add-to-cart and checkout operations.
5. **Risk:** Accessibility flow may regress if checkout path assumptions change.
6. **Mitigation:** Keep accessibility spec coverage for authenticated navigation to checkout and run required a11y suite.

## Implementation Plan

### Files to Modify

1. `app/frontend/src/components/StorePage.jsx`
   - Remove bottom cart content card and related imports no longer needed.
2. `cypress/pages/CatalogPage.ts`
   - Replace cart-block selectors/methods with header-cart-driven helpers as needed.
3. `cypress/e2e/catalog-cart.cy.ts`
   - Migrate cart assertions from store cart block to header count and checkout-page validation.
4. `cypress/e2e/checkout.cy.ts`
   - Remove dependencies on store cart-block selectors; assert behavior through checkout page and header count.
5. `cypress/e2e/orders-list.cy.ts`
   - Update pre-checkout navigation that currently uses store in-page checkout button.
6. `cypress/e2e/orders-details.cy.ts`
   - Update pre-checkout navigation that currently uses store in-page checkout button.
7. `cypress/e2e/accessibility.cy.ts`
   - Adjust authenticated-page checkout navigation step to use header cart icon.
8. `requirements/feature_SCRUM-25.md`
   - Record implementation, verification, review, and timeline updates after coding.

### Build Sequence

1. Remove cart content block from `StorePage` and ensure store layout remains stable.
2. Refactor Cypress page object/selectors to remove references to deleted cart-block elements.
3. Update affected E2E and a11y specs to use header cart icon/count workflow.
4. Run required validation (`test:e2e`, `test:a11y`, `workflow:final-pass`) and capture results.

## Test Strategy

### Primary Validation (Required)

1. On `/store`, confirm no bottom cart content block is rendered.
2. Add item from catalog and verify header cart count increments.
3. Use header cart icon to navigate to `/checkout` and confirm checkout page renders.
4. Complete checkout and verify header cart count resets to `0`.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Removed the redundant cart content card from `StorePage` so `/store` no longer renders the legacy bottom cart block.
  - Preserved catalog list, search, pagination, and add-to-cart behavior on `/store`.
- Backend/API impact:
  - None. No backend endpoints, contracts, or database behavior changed.
- Test/spec changes:
  - Migrated checkout navigation in affected Cypress specs from `go-to-checkout` (removed element) to header cart icon flow.
  - Updated catalog page object helpers to use `openCheckoutFromHeader()` and removed obsolete cart-block helpers.

## Verification Results

- `BACKEND_PORT=4420 FRONTEND_PORT=5195 npm run test:e2e`
  - Result: pass. All specs passed (`57/57`).
- `BACKEND_PORT=4421 FRONTEND_PORT=5196 npm run test:a11y`
  - Result: pass. Accessibility spec passed (`5/5`).
- `BACKEND_PORT=4422 FRONTEND_PORT=5197 REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-25.md JIRA_ISSUE_KEY=SCRUM-25 JIRA_FINAL_PASS_PUBLISH=true JIRA_FINAL_PASS_APPROVED=no npm run workflow:final-pass`
  - Result: pass. Final pass completed and Jira final-artifact publish executed in dry-run mode.

## Review Results

- Review scope:
  - `app/frontend/src/components/StorePage.jsx`
  - `cypress/pages/CatalogPage.ts`
  - `cypress/e2e/catalog-cart.cy.ts`
  - `cypress/e2e/checkout.cy.ts`
  - `cypress/e2e/orders-list.cy.ts`
  - `cypress/e2e/orders-details.cy.ts`
  - `cypress/e2e/accessibility.cy.ts`
  - `requirements/feature_SCRUM-25.md`
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `app/frontend/src/components/StorePage.jsx`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `cypress/e2e`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `cypress/pages/CatalogPage.ts`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-15T17:22:19Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Jira-backed clarification started for SCRUM-25.
- 2026-03-15T17:22:19Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Clarification decisions and testable acceptance criteria finalized for catalog cart-block removal.
- 2026-03-15T17:23:35Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed current store component and Cypress coverage affected by cart-block removal.
- 2026-03-15T17:23:35Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized implementation files, migration approach, risks, and verification plan for SCRUM-25.
- 2026-03-15T17:35:53Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Removed legacy store cart block UI and migrated affected Cypress selectors/workflows.
- 2026-03-15T17:35:53Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Frontend and Cypress updates completed for header-only checkout entry behavior.
- 2026-03-15T17:35:53Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Ran required regression and final-pass validation for SCRUM-25.
- 2026-03-15T17:35:53Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | `test:e2e`, `test:a11y`, and `workflow:final-pass` all passed.
- 2026-03-15T17:35:53Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed changed frontend/Cypress files and completed scoped Snyk scans with no issues.

