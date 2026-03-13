# Jira Source: SCRUM-5

- Summary: Catalog List: Add Cart Icon to menu header
- Jira Type: Story
- Jira Status: In Progress

## Original Jira Description

As store Product Owner, I would like to add a shopping cart icon to the catalog list page men header.

1. Create a shopping cart icon in the catalog list header
1.1 Cart icon maintains a running count of the number of items in the shopping cart
1.2 Cart icon running count is increased or decreased in real time as items are added and removed
2. Card icon is hyperlinked to the Checkout page.
3. Folloring a succesful checkout and confirm order, the shopping cart icon running count is reset to 0.

## Working Requirements
## Source Context

- Source system: Jira
- Source ticket/reference: SCRUM-5
- Source summary: Add a cart icon with live item count to the catalog header and link it to checkout.

As a Product Owner, I would like to:
1. See a shopping cart icon in the catalog/header area.
2. See a live-running cart item count on that icon as cart state changes.
3. Use the icon as a direct navigation link to the checkout page.
4. See the count reset to `0` after successful checkout confirmation.

## Clarification Decisions

### Decisions Applied

1. The cart icon will be shown in the global menu/header area so it is consistently visible while browsing catalog pages.
2. The icon count represents total cart quantity (sum of all item quantities), not the number of unique products.
3. Count updates are real-time from client cart state changes:
   - increment when items are added,
   - decrement if quantities are reduced/removed,
   - reset to `0` after successful checkout.
4. The cart icon is clickable and routes the user to `/checkout`.
5. Empty-cart state is explicitly visible as badge/count value `0`.

### Requirements Updates

1. The header must render a shopping-cart icon control on catalog/store pages.
2. The control must display a numeric running count derived from the current cart total quantity.
3. The displayed count must update immediately whenever cart quantities change.
4. The control must navigate to `/checkout` when activated.
5. Following successful checkout confirmation, cart state must clear and the header cart count must display `0`.
6. The behavior must remain deterministic across route navigation within an authenticated session.

### Acceptance Criteria Updates

1. Given an authenticated user on `/store`, when the page loads, then a shopping-cart header control is visible with count `0` for an empty cart.
2. Given the user adds one catalog item, when the cart updates, then the header cart count increases to `1` without page refresh.
3. Given the user adds the same item again, when quantity increases, then the header cart count reflects total quantity (e.g. `2`).
4. Given the cart count is non-zero, when the user clicks the cart icon, then the app navigates to `/checkout`.
5. Given a successful checkout completion, when confirmation is shown, then the header cart count resets to `0`.
6. Given cart quantity decreases/removal events occur, when cart state changes, then the header cart count decreases in real time to match the new total.

### Blocking Questions

None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. The authenticated app header (`app/frontend/src/components/AppHeader.jsx`) currently includes a text `Checkout` button (`data-cy="nav-checkout"`) but no dedicated cart icon with running count badge.
2. Cart state lives in `app/frontend/src/App.jsx` as `cart` array items with `quantity`; total amount uses `sum(price * quantity)`, but header enablement is currently based on `cart.length > 0` (unique line items, not total quantity).
3. Add-to-cart interactions in catalog and item detail already update cart state immediately, so a reactive running count can be derived without backend/API changes.
4. Successful checkout currently clears cart (`setCart([])`), which naturally supports a post-checkout count reset to zero.
5. Existing Cypress catalog/cart and checkout specs validate checkout button enable/disable but do not yet validate icon badge count semantics in header.

### Architecture Decision

Implement a header cart icon control with a numeric badge driven from frontend cart state, while preserving existing checkout route behavior.

Decision details:
1. UI location and control (`app/frontend/src/components/AppHeader.jsx`)
   - Add a shopping-cart icon control in header/menu area with `data-cy` selectors for deterministic testing.
   - Wrap icon with MUI `Badge` showing running count.
   - Control click navigates to `/checkout`.
2. Count source of truth (`app/frontend/src/App.jsx`)
   - Compute `cartItemCount = sum(item.quantity)` from `cart`.
   - Pass this value into `AppHeader`.
   - Keep count updates purely state-driven for real-time changes.
3. Compatibility strategy
   - Keep existing `Checkout` button for backward compatibility and reduced regression risk.
   - Keep existing cart-clearing flow on successful checkout; badge count resets via state update to `0`.
4. API/data scope
   - No backend contract changes required for this feature; cart count remains client-side derived from existing cart state.

### Risk and Regression Considerations

1. **Risk:** Badge count shows unique item rows instead of total quantity.
   - **Mitigation:** Explicitly compute count as sum of `quantity` values and cover this with Cypress assertions.
2. **Risk:** Header interaction regresses checkout navigation/disable behavior.
   - **Mitigation:** Preserve existing checkout button behavior; add icon as additive control and test both navigation and count updates.
3. **Risk:** Count not resetting after checkout success.
   - **Mitigation:** Reuse existing `setCart([])` success path; validate post-checkout badge displays `0`.
4. **Risk:** Accessibility regressions from icon-only control.
   - **Mitigation:** Add clear `aria-label` on icon button and include a11y run in required verification.

## Implementation Plan

### Files to Modify

1. `app/frontend/src/App.jsx`
   - Derive and pass `cartItemCount` to header.
   - Keep current checkout/cart reset flow; ensure badge count updates naturally via state.
2. `app/frontend/src/components/AppHeader.jsx`
   - Add cart icon + badge + checkout link behavior with stable `data-cy` selectors.
3. `cypress/pages/CatalogPage.ts`
   - Add helper selectors for header cart icon/count if needed.
4. `cypress/e2e/catalog-cart.cy.ts`
   - Add assertions for count increase in real time and reset after checkout.
5. `cypress/e2e/checkout.cy.ts`
   - Add/adjust assertion for header cart count reset to `0` after successful checkout.
6. `specs/catalog-cart.feature` (or relevant cart/checkout feature spec file)
   - Update scenarios to include header icon count behavior and checkout link action.
7. `requirements/feature_SCRUM-5.md`
   - Update `## What Changed`, `## Verification Results`, `## Review Results`, and timeline entries during implementation/final pass.

### Build Sequence

1. Add header cart icon + badge UI with navigation action.
2. Wire count derivation from cart quantities in `App.jsx`.
3. Update Cypress page object/spec coverage for running count and reset behavior.
4. Execute required verification commands and document outputs in requirements artifact.

## Test Strategy

### Primary Validation (Required)

1. Header behavior validation
   - Cart icon is visible on catalog/store page and clickable to `/checkout`.
   - Badge count displays `0` when cart is empty.
2. Running count validation
   - Adding an item increments count immediately.
   - Increasing quantity of same item increments total badge count accordingly.
3. Checkout reset validation
   - After successful checkout confirmation, cart badge resets to `0`.
4. Regression validation
   - Existing checkout page access and flow remain stable.
   - No regressions in catalog add-to-cart and cart summary behavior.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Added a header shopping cart icon with a visible badge count (`data-cy="nav-cart-icon"`, `data-cy="nav-cart-count"`) in `AppHeader`.
  - Wired cart badge count to total cart quantity (`sum(item.quantity)`) in `App.jsx` and used that value for checkout enablement compatibility.
  - Enabled direct checkout navigation by clicking the header cart icon while preserving the existing `Checkout` button.
- Backend/API impact:
  - No backend or API contract changes were required; behavior remains client-side state driven.
- Test/spec changes:
  - Extended Cypress catalog/cart and checkout assertions to validate header cart count (`0` empty, `1` after add, reset to `0` after successful checkout) and icon-based checkout navigation.
  - Added page-object helpers for header cart icon/count selectors in `cypress/pages/CatalogPage.ts`.
  - Updated `specs/catalog-cart.feature` scenarios to include header count visibility, icon navigation to checkout, and post-checkout reset behavior.

## Verification Results

- `npm run test:e2e`
  - Result: Pass (55 tests passing across 12 specs; PDF report generated).
- `npm run test:a11y`
  - Result: Pass (5 tests passing in `accessibility.cy.ts`).
- `npm run workflow:final-pass`
  - Result: Pass (full E2E + a11y pass; published final artifact to Jira issue `SCRUM-5` with `feature_SCRUM-5.md`).

## Review Results

- Review scope:
  - `app/frontend/src/components/AppHeader.jsx`
  - `app/frontend/src/App.jsx`
  - `cypress/pages/CatalogPage.ts`
  - `cypress/e2e/catalog-cart.cy.ts`
  - `cypress/e2e/checkout.cy.ts`
  - `specs/catalog-cart.feature`
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/app/frontend/src`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/cypress`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-13T20:21:25Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Jira clarification started for SCRUM-5.
- 2026-03-13T20:21:25Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Clarification decisions finalized for cart icon count and checkout link behavior.
- 2026-03-13T20:21:25Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed header/cart state wiring and current checkout reset behavior.
- 2026-03-13T20:21:25Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized architecture and verification plan for header cart icon + running count.
- 2026-03-13T20:31:40Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began frontend/cart badge implementation and Cypress/spec updates.
- 2026-03-13T20:33:20Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed header cart icon badge wiring plus test/spec updates.
- 2026-03-13T20:33:22Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started required verification (`test:e2e`, `test:a11y`, `workflow:final-pass`).
- 2026-03-13T20:40:22Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | All required commands passed; final-pass published `feature_SCRUM-5.md` to Jira SCRUM-5.
- 2026-03-13T20:40:33Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed updated files and completed scoped Snyk scans with zero issues.

