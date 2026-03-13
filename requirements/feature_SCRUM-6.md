# Jira Source: SCRUM-6

- Summary: Checkout: Add Item Incr/Decr and Delete
- Jira Type: Story
- Jira Status: In Progress

## Original Jira Description

As store Product Owner, I would like to adjust the number of items in my shopping cart on the Checkout page.

1. In Checkout, next to every item in the shopping cart, provide a + or - icon on every line item along with a delete icon.
1.1. The + and - icons adds or deletes one from the item count on that line
2. As we adjust the items counts and to reflect the latest changes:
2.1 Adjust to Total $ amount to reflect the change in realtime
2.2 In the meny header adjust the toal cart count in realtime
3. Consider changing the current simple line item display in Checkout and Checkout overall to more of a table based approach 
4. The Cart icon and Checkout buttons in the menus both point to the checkout Page
4.1 Remove the Checkout button from the menu header.

## Working Requirements
## Source Context

- Source system: Jira
- Source ticket/reference: SCRUM-6
- Source summary: Add quantity increment/decrement and delete controls for checkout line items, keep totals/cart count in sync, and remove header Checkout button in favor of cart icon navigation.

As a Product Owner, I would like to:
1. Adjust cart line-item quantities directly on the checkout page.
2. Remove cart items from checkout with an explicit delete action.
3. See checkout total and header cart count update immediately as cart quantities change.
4. Use the header cart icon as the single menu path to checkout after removing the Checkout header button.

## Clarification Decisions

### Decisions Applied

1. Checkout line items will include explicit controls: increment (`+`), decrement (`-`), and delete for each row.
2. Quantity decrement behavior is bounded at `1`; clicking `-` at quantity `1` removes the line item (same net effect as delete).
3. Checkout total and header cart badge count both use cart state as the source of truth and update in real time after every quantity/delete action.
4. The existing checkout layout can be modernized to a table-style presentation, but table structure is optional as long as per-row controls and deterministic updates are delivered.
5. Header navigation is consolidated by removing the `Checkout` text button from the authenticated header while keeping the cart icon as the checkout route entry point.
6. Cart badge count semantics remain total quantity (sum of quantities), not unique product rows.

### Requirements Updates

1. The checkout page must render increment, decrement, and delete controls for every cart line item.
2. Activating increment must increase the target line quantity by exactly `1` and persist that state in current session cart state.
3. Activating decrement must reduce the target line quantity by exactly `1` when quantity is greater than `1`; when quantity is `1`, the line item must be removed from the cart.
4. Activating delete must remove the target line item regardless of current quantity.
5. After every quantity or delete action, checkout subtotal/total values must recompute immediately and reflect the updated cart state without refresh.
6. After every quantity or delete action, the header cart badge count must update immediately to the new total quantity.
7. The authenticated header must not render the `Checkout` text button once this feature is delivered.
8. The header cart icon must continue navigating to `/checkout` and remain discoverable via stable test selectors.
9. Existing checkout submission behavior remains unchanged aside from using the updated cart quantities/items at submit time.

### Acceptance Criteria Updates

1. Given a cart with at least one item on `/checkout`, when the page loads, then each line item shows visible `+`, `-`, and delete controls.
2. Given a line item quantity of `1`, when the user clicks `+`, then that line quantity becomes `2`, the checkout total increases accordingly, and the header cart badge increases by `1` without page refresh.
3. Given a line item quantity greater than `1`, when the user clicks `-`, then that line quantity decreases by `1`, the checkout total decreases accordingly, and the header cart badge decreases by `1` without page refresh.
4. Given a line item quantity of `1`, when the user clicks `-`, then the line item is removed from checkout and cart state.
5. Given any line item quantity, when the user clicks delete, then that line item is removed from checkout and cart state.
6. Given line item updates/removals occur, when cart state changes, then displayed checkout totals and header badge always match the updated cart state.
7. Given an authenticated user in app header, when the feature is active, then the `Checkout` header button is not rendered.
8. Given an authenticated user, when they click the header cart icon, then the app navigates to `/checkout`.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Checkout line items are currently rendered as simple text rows (`{item.name} x {item.quantity}`) in `app/frontend/src/components/CheckoutPage.jsx` with no inline quantity or delete controls.
2. Cart mutation logic exists only for incrementing from catalog/item detail via `addToCart` in `app/frontend/src/App.jsx`; there is no decrement/remove helper used by checkout UI.
3. Checkout totals and header badge are already state-derived:
   - checkout total uses `totalCents = sum(priceCents * quantity)`
   - header badge uses `cartItemCount = sum(quantity)`
   This enables realtime updates once checkout can mutate cart state.
4. Authenticated header still renders `nav-checkout` button in `app/frontend/src/components/AppHeader.jsx` alongside the cart icon, which conflicts with SCRUM-6 requirement to remove the button.
5. Existing Cypress coverage for checkout validates submit flows and error handling, but does not yet validate checkout-page quantity controls, per-line delete behavior, or removal of the header checkout button.

### Architecture Decision

Implement checkout-side cart editing using centralized cart update helpers in `App.jsx`, and keep `CheckoutPage` presentational with explicit callbacks for increment/decrement/delete.

Decision details:
1. **State ownership**
   - Keep cart as single source of truth in `App.jsx`.
   - Introduce deterministic helpers:
     - increment line item quantity by item id,
     - decrement line item quantity by item id (remove if quantity reaches 0/attempted below 1),
     - remove line item by item id.
2. **Checkout UI controls**
   - Extend `CheckoutPage.jsx` props with callbacks (`onIncrementItem`, `onDecrementItem`, `onRemoveItem`).
   - Render per-row action controls with stable `data-cy` selectors for automation (e.g., quantity label, plus/minus, delete).
   - Optional table-style UI is acceptable; prioritizing deterministic controls over visual refactor depth.
3. **Header navigation consolidation**
   - Remove `nav-checkout` text button from `AppHeader.jsx`.
   - Keep `nav-cart-icon` as the single header route entry to `/checkout`.
4. **Behavior preservation**
   - No backend/API changes required; `/api/checkout` payload already reflects current cart state (`items: [{id, quantity}]`).
   - Existing checkout submit and order-confirmation behavior remains unchanged.

### Risk and Regression Considerations

1. **Risk:** Quantity/deletion helpers could introduce negative quantities or stale rows.
   - **Mitigation:** Bound decrement logic and remove rows at floor condition; avoid in-place mutation and rely on pure `setCart` transforms.
2. **Risk:** Removing header `Checkout` button may break existing tests and user flows relying on `nav-checkout`.
   - **Mitigation:** Update Cypress/page objects/specs to use `nav-cart-icon` for header checkout navigation and explicitly assert absence of `nav-checkout`.
3. **Risk:** Checkout total/badge drift from cart edits.
   - **Mitigation:** Continue deriving both from `cart` state (no duplicated counters), and add assertions after each increment/decrement/delete action.
4. **Risk:** UI control discoverability/accessibility regressions.
   - **Mitigation:** Use explicit button labels/aria labels and preserve keyboard-focusable MUI button controls; validate via `npm run test:a11y`.

## Implementation Plan

### Files to Modify

1. `app/frontend/src/App.jsx`
   - Add cart line-item update/remove helpers and pass callbacks to `CheckoutPage`.
   - Keep checkout payload behavior unchanged, now using updated cart state from checkout interactions.
2. `app/frontend/src/components/CheckoutPage.jsx`
   - Add per-line increment/decrement/delete controls and deterministic `data-cy` hooks.
   - Optionally shift line-item rendering to table-style layout while maintaining clarity and responsiveness.
3. `app/frontend/src/components/AppHeader.jsx`
   - Remove `nav-checkout` text button; retain cart icon as checkout navigation.
4. `cypress/pages/CheckoutPage.ts`
   - Add helper methods for checkout line-item controls/selectors.
5. `cypress/e2e/checkout.cy.ts`
   - Add scenario coverage for increment/decrement/delete behavior, realtime totals/badge updates, and checkout-button removal impacts.
6. `cypress/e2e/catalog-cart.cy.ts`
   - Update any assertions that depend on `nav-checkout`; align with cart-icon-only header navigation.
7. `specs/checkout.feature` and `specs/catalog-cart.feature` (if needed)
   - Add/update scenarios to reflect checkout line-item editing and header navigation change.
8. `requirements/feature_SCRUM-6.md`
   - Update `What Changed`, `Verification Results`, `Review Results`, and timeline entries after implementation/testing.

### Build Sequence

1. Implement cart mutation helpers in `App.jsx` and wire callbacks into checkout route.
2. Implement checkout per-line controls in `CheckoutPage.jsx` with stable selectors.
3. Remove header checkout button from `AppHeader.jsx` and ensure cart icon remains primary path.
4. Update Cypress page objects and e2e specs for new controls and nav behavior.
5. Update Gherkin specs to match expected behavior.
6. Run required verification commands and document results in requirements artifact.

## Test Strategy

### Primary Validation (Required)

1. **Checkout cart-edit controls**
   - Verify each checkout row has `+`, `-`, delete controls and displayed quantity.
2. **Increment/decrement behavior**
   - Increment increases row quantity and total immediately.
   - Decrement reduces quantity when >1; at 1 removes row.
3. **Delete behavior**
   - Delete removes target row regardless of current quantity.
4. **Realtime totals and header count**
   - After each cart edit, checkout total and header cart badge remain in sync with cart state.
5. **Header navigation**
   - `nav-checkout` is absent.
   - `nav-cart-icon` still routes to `/checkout`.
6. **Checkout submission compatibility**
   - Successful checkout still posts updated `items` quantities and clears cart/badge afterward.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Added checkout line-item cart controls (`+`, `-`, delete) in `CheckoutPage` with stable selectors for quantity and actions.
  - Switched checkout cart rendering to a table-style layout that shows item, quantity, subtotal, and row actions.
  - Added cart mutation helpers in `App.jsx` for increment, decrement-with-floor-removal, and explicit delete by item id.
  - Removed the authenticated header `Checkout` button and kept `nav-cart-icon` as the single header checkout navigation control.
  - Preserved realtime cart total and header badge behavior via existing cart-derived calculations.
- Backend/API impact:
  - No backend contract changes; checkout API payload still uses current cart state quantities (`items: [{id, quantity}]`).
- Test/spec changes:
  - Extended Cypress checkout page object with helpers for first-row quantity and increment/decrement/delete actions.
  - Added checkout e2e coverage for increment/decrement/delete behavior and quantity-1 decrement removal path.
  - Updated catalog/cart and checkout tests to assert `nav-checkout` is absent and rely on cart icon/header count behavior.
  - Updated `specs/checkout.feature` with scenarios for checkout line-item editing and header checkout button removal expectation.

## Verification Results

- `npm run test:e2e`
  - Result: Pass (57 tests passing across 12 specs, including new checkout quantity/delete scenarios).
- `npm run test:a11y`
  - Result: Pass (5 tests passing in `accessibility.cy.ts`).
- `npm run workflow:final-pass`
  - Result: Pass (full e2e + a11y succeeded; Jira final artifact published to `SCRUM-6` as `feature_SCRUM-6.md`).

## Review Results

- Review scope:
  - `app/frontend/src/App.jsx`
  - `app/frontend/src/components/AppHeader.jsx`
  - `app/frontend/src/components/CheckoutPage.jsx`
  - `cypress/pages/CheckoutPage.ts`
  - `cypress/e2e/checkout.cy.ts`
  - `cypress/e2e/catalog-cart.cy.ts`
  - `specs/checkout.feature`
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

- 2026-03-13T21:04:44Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Imported SCRUM-6 from Jira and initialized requirements artifact.
- 2026-03-13T21:04:44Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Clarified checkout quantity controls, delete behavior, realtime totals/badge updates, and header navigation changes.
- 2026-03-13T21:05:58Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed checkout, app cart-state flow, header controls, and Cypress coverage gaps.
- 2026-03-13T21:05:58Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized architecture, risks, file plan, and verification strategy for SCRUM-6 implementation.
- 2026-03-13T21:06:20Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began checkout line-item controls, cart mutation helpers, and header checkout-button removal.
- 2026-03-13T21:08:40Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed frontend/cart control behavior plus Cypress/spec updates.
- 2026-03-13T21:08:45Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started required verification commands (`test:e2e`, `test:a11y`, `workflow:final-pass`).
- 2026-03-13T21:15:08Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | All required test/final-pass commands passed and Jira final artifact publish succeeded for SCRUM-6.
- 2026-03-13T21:15:53Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed scoped review and Snyk scans with no new security findings.

