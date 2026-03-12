As a store Product Owner, I want customers to open a dedicated order details page for a previously placed order.

## Clarification Decisions

### Decisions Applied

1. "Logged in customer" means an authenticated non-admin store user.
2. The order details page is read-only and shows one existing order at a time.
3. Customers may view only their own orders; cross-user access must be blocked by existing auth patterns.
4. The new route should be parameterized by order identifier (for example: `/orders/:orderId`).
5. "All details" for this feature includes:
   - order header: `orderId`, `createdAt`, order status (if already modeled), totals,
   - line items: product name, quantity, unit price, line subtotal,
   - fulfillment summary fields that already exist in current order data (for example shipping/payment summary if available).
6. No order editing, cancellation, refunds, or re-order actions are included in this feature.
7. Links to order details are required in:
   - the orders listing page (each order id links to details),
   - the checkout complete page (the displayed order number links to details).

### Requirements Updates

1. Add a dedicated authenticated order details page/route that loads one order by its public identifier.
2. Render order header details and line-item details using existing stored order data.
3. Add order-details hyperlinks from the orders listing experience.
4. Add order-details hyperlink from the checkout complete page order number.
5. Enforce ownership checks so users cannot view another user's order details.
6. Show deterministic empty/not-found and error states when the order cannot be loaded.

### Acceptance Criteria Updates

1. Given an authenticated user with an existing order, when they open that order details URL, then they see the order header and line items for that order.
2. Given an authenticated user on the orders listing page, when they select an order link, then they are routed to that order's details page.
3. Given an authenticated user on checkout complete, when they select the displayed order number, then they are routed to that same order's details page.
4. Given an authenticated user attempts to open another user's order details URL, when access is validated, then access is denied according to existing auth behavior (redirect/unauthorized/not-found pattern).
5. Given a missing or invalid order id, when the details page loads, then a deterministic not-found/error state is shown without breaking the app shell.

### Blocking Questions

1. None.

### Status

Completed (superseded by Technical Analysis status below).

## Technical Analysis

### Current State Observations

1. Order write-path already persists rich order data in backend tables `orders` and `order_items`, including shipping fields, cardholder name, payment last4, totals, and timestamps.
2. Existing authenticated route `GET /api/orders` currently returns order header fields only (`orderId`, `createdAt`, `totalCents`) for the current user.
3. Frontend currently supports an orders list route (`/orders`) but does not yet include a per-order details route.
4. Checkout success currently renders text `Order confirmed (#<orderId>)` and does not render a hyperlink for the order id.
5. Authentication and route protection patterns already exist and can be reused to enforce order-ownership visibility.

### Architecture Decision

Implement a dedicated authenticated order-details read flow using a new order-details API endpoint plus a new frontend route.

Decision details:
1. Add backend endpoint (for example `GET /api/orders/:orderId`) that resolves order by public order id and user ownership from auth context.
2. Return a normalized order-details payload containing header, line items, and available fulfillment/payment summary fields already stored in the current schema.
3. Add frontend route `'/orders/:orderId'` and an `OrderDetailsPage` component that fetches and renders this payload.
4. Link into the new route from:
   - orders list entries (`/orders`), and
   - checkout complete success message order number.

Rationale and trade-offs:
1. Reuses existing schema and minimizes migration risk.
2. Keeps feature read-only and scoped, reducing regression surface.
3. Adds one focused endpoint rather than overloading the list endpoint with expanded payloads.
4. Defers non-required actions (cancel/reorder/refund) to future features.

### API and Data Contract Impact

1. New authenticated endpoint: `GET /api/orders/:orderId`.
2. Ownership enforcement: lookup must include both `public_order_id` and authenticated `user_id`; no client-provided user id accepted.
3. Suggested response shape:
   - `order`: `{ orderId, createdAt, totalCents, shipping, paymentSummary }`
   - `items`: array of `{ itemId?, headerOrName, quantity, unitPriceCents, lineTotalCents }`
4. Error contracts:
   - `401` unauthorized when token missing/invalid (existing middleware behavior),
   - `404` when order not found or inaccessible for current user (prevents account enumeration),
   - `500` deterministic fallback for unexpected failures.
5. No schema migration is required; all required fields exist in `orders`, `order_items`, and `catalog_items`.

### UI/UX and Permission Impact

1. Add new route/page for order details in authenticated app routes.
2. Orders list page should render each order id as a link/button to details.
3. Checkout complete message should render the order number as a link to details.
4. Order details page should include deterministic states:
   - loading,
   - not found/inaccessible,
   - generic fetch error.
5. Route remains inaccessible to unauthenticated users under existing redirect/session handling.

### Risk and Regression Considerations

1. Access-control leakage risk:
   - Mitigation: strict backend ownership filter (`user_id = req.userId`) and `404` for inaccessible ids.
2. Data-shape mismatch risk between backend and UI:
   - Mitigation: explicit response contract and Cypress assertions for key fields.
3. Checkout UX regression risk when converting success text to hyperlink:
   - Mitigation: keep existing success message semantics and augment only the order-id element as a link.
4. Legacy order rows may have partial fields:
   - Mitigation: defensively render missing optional fields and avoid hard failures in UI.

### Verification and Test Plan

1. API validation:
   - authenticated user can fetch own order details,
   - user cannot fetch another user's order details (`404`),
   - unauthenticated access returns `401`,
   - response includes line items and expected summary fields.
2. UI validation:
   - selecting an order on `/orders` navigates to `/orders/:orderId`,
   - checkout complete order number links to details route,
   - details page renders header and line items,
   - deterministic not-found/error states render correctly.
3. Regression validation:
   - existing orders list behavior remains intact,
   - checkout flow still completes and shows success state,
   - existing auth redirects remain unchanged.
4. Required pre-handoff commands (implementation phase):
   - `npm run test:e2e`
   - `npm run test:a11y`
   - `npm run workflow:final-pass`

### Status

Implemented and verified.

## What Changed

1. Backend/API updates:
   - Added authenticated `GET /api/orders/:orderId` endpoint in `app/backend/src/server.js`.
   - Endpoint enforces user ownership by scoping lookups to `req.userId`, returns `404` for missing/inaccessible orders, and returns normalized order details plus line items.
   - Included legacy-compatible order-id resolution fallback for rows without `public_order_id`.
2. Frontend/UI updates:
   - Added new authenticated route `'/orders/:orderId'` in `app/frontend/src/App.jsx`.
   - Added `OrderDetailsPage` UI at `app/frontend/src/components/OrderDetailsPage.jsx` with deterministic loading, error, and content states.
   - Updated `OrdersPage` order id rendering to link each order row to order details.
   - Updated checkout complete UX in `CheckoutPage` to render clickable order-number link to order details.
3. Test/spec updates:
   - Added Cypress spec `cypress/e2e/orders-details.cy.ts` for:
     - navigation from orders list to details,
     - navigation from checkout complete order number to details,
     - deterministic 404/not-found behavior.
   - Added Cypress page object `cypress/pages/OrderDetailsPage.ts` and updated `cypress/pages/OrdersPage.ts` / `cypress/pages/CheckoutPage.ts` helpers.
   - Updated accessibility coverage in `cypress/e2e/accessibility.cy.ts` and `specs/accessibility.feature` to include order-details page checks.
   - Added behavior source spec `specs/order-details.feature`.

## Verification Results

1. `BACKEND_PORT=4100 FRONTEND_PORT=5180 npm run test:e2e` -> Passed (12 specs, 51 tests, including `orders-details.cy.ts`).
2. `BACKEND_PORT=4100 FRONTEND_PORT=5180 npm run test:a11y` -> Passed (5 tests, includes order-details page WCAG check).
3. `BACKEND_PORT=4100 FRONTEND_PORT=5180 REQUIREMENTS_REVIEW_PATH=requirements/feature_18.md npm run workflow:final-pass` -> Passed.

## Review Results

1. Findings summary:
   - Critical: 0
   - High: 0
   - Medium: 0
   - Low: 0
2. Residual risk notes:
   - Order details currently remain read-only and do not include post-order actions (cancel/refund/reorder), which is expected for this feature scope.
3. Security scan:
   - Scoped Snyk Code scan on changed first-party files (`snyk_code_scan`) -> Passed (`issueCount: 0`) for:
     - `app/backend/src/server.js`
     - `app/frontend/src/App.jsx`
     - `app/frontend/src/components/CheckoutPage.jsx`
     - `app/frontend/src/components/OrdersPage.jsx`
     - `app/frontend/src/components/OrderDetailsPage.jsx`
     - `cypress/e2e/orders-details.cy.ts`
     - `cypress/e2e/accessibility.cy.ts`
     - `cypress/pages/OrderDetailsPage.ts`
     - `cypress/pages/OrdersPage.ts`
     - `cypress/pages/CheckoutPage.ts`
4. Final status:
   - Ready for handoff.

## Phase Timeline

- 2026-03-12T22:27:41Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Expanded feature 18 from a brief story into explicit requirement scope and constraints.
- 2026-03-12T22:27:41Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Added decisions, requirement updates, acceptance criteria, and readiness status for analysis.
- 2026-03-12T22:27:41Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed existing orders list, checkout success UX, backend order schema, and auth patterns for order-details design.
- 2026-03-12T22:27:41Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized architecture decision, API contract impact, risk controls, and verification plan for feature 18.
- 2026-03-12T22:43:31Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started backend endpoint, frontend route/page, and link wiring for order details.
- 2026-03-12T22:43:31Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Delivered order details API/UI, navigation links, Cypress specs, and feature spec updates.
- 2026-03-12T22:43:31Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Ran required e2e and accessibility verification suites on isolated ports.
- 2026-03-12T22:49:06Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed `test:e2e`, `test:a11y`, and `workflow:final-pass` with feature 18 artifact.
- 2026-03-12T22:49:06Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed scoped Snyk Code scans with zero findings and finalized handoff status.
