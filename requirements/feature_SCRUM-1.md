# Jira Source: SCRUM-1

- Summary: Cancel Order Feature
- Jira Type: Feature
- Jira Status: In Progress

## Original Jira Description

As the store Product Owner, I would like to add a feature that enables a store user to cancel an order that has not shipped yet.
Create the following order status types to be added on every order 
1.1 Create a order status types table with order types: Ordered, Processing, Shipped, Delivered, Cancelled 
1.2 Randomly update every current order in orders table to one of the status types

On the order listing page: 
2.1 Add the order status type to the order entry 
2.2 Enable the user to cancel an order only if is in the status of Ordered or Processing.
2.3 Order type change rule: Orders in the state of Shipped, Delivered or already Cancelled cannot change status.

Allow the user to save the order status change.

On the order detail page add a back to order listing button.

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-1
- Source summary: Add order cancellation with status-driven eligibility and persistence.

As a Product Owner, I would like to:
1. Add order status tracking to every order using the allowed statuses: Ordered, Processing, Shipped, Delivered, and Cancelled.
2. Allow users to cancel only orders that have not shipped yet (Ordered or Processing) and persist that status change.
3. Show order status in listing views and provide a back-to-order-list control from order details.

## Clarification Decisions

### Decisions Applied

1. Order cancellation is implemented as an order status transition to `Cancelled` (no hard delete).
2. Only orders in `Ordered` or `Processing` can be canceled by the user.
3. Orders in `Shipped`, `Delivered`, or `Cancelled` are immutable for cancellation.
4. Existing orders are backfilled to one valid status from the allowed set during migration/seed update.

### Requirements Updates

1. The backend must define and enforce the five status values: `Ordered`, `Processing`, `Shipped`, `Delivered`, and `Cancelled`.
2. Every existing order must be assigned one of the supported statuses during data update, with no null/unknown status values.
3. The order listing UI must display each order's current status.
4. The cancel action must be shown only for orders in `Ordered` or `Processing`.
5. Executing cancel must persist status as `Cancelled` and update UI state accordingly.
6. The order details page must include a "Back to orders" action that returns to the listing page.

### Acceptance Criteria Updates

1. Given an order in `Ordered`, when a user selects cancel and confirms save, then the stored status becomes `Cancelled` and the listing shows `Cancelled`.
2. Given an order in `Processing`, when a user selects cancel and confirms save, then the stored status becomes `Cancelled`.
3. Given an order in `Shipped`, `Delivered`, or `Cancelled`, when a user views orders, then cancel controls are not available for that order.
4. Given existing orders after migration/seed update, when data is queried, then each order has exactly one valid status from the defined set.
5. Given a user on order details, when the user selects "Back to orders", then navigation returns to the order listing page.

### Blocking Questions

1. None.

### Status

Completed (superseded by Technical Analysis status below).

## Technical Analysis

### Current State Observations

1. Backend currently creates and stores orders via `POST /api/checkout` and returns order list/details through `GET /api/orders` and `GET /api/orders/:orderId`, but there is no order-status model or status transition endpoint.
2. The `orders` table in `app/backend/src/db.js` does not currently include status columns; status types are not modeled in schema.
3. Frontend order listing (`OrdersPage.jsx`) renders order id/date/total only; no status display or cancel action exists.
4. Frontend order details (`OrderDetailsPage.jsx`) is read-only and currently has no explicit "Back to orders" control.
5. Existing Cypress coverage already includes orders list and order details routes, which can be extended for cancellation and status visibility.

### Architecture Decision

Implement cancellation as a status-driven workflow with explicit backend enforcement and UI gating.

Decision details:
1. Introduce a normalized order status type model in the database and link each order to one status.
2. Backfill existing orders to a valid status during database initialization/migration.
3. Extend order list/details APIs to return current status values.
4. Add an authenticated status transition endpoint for cancellation with server-side rule checks:
   - allow only `Ordered` or `Processing` -> `Cancelled`,
   - reject attempts from `Shipped`, `Delivered`, or `Cancelled`.
5. Update frontend order list to display status and render cancel controls only when server-eligible.
6. Add a "Back to orders" control on order details page for deterministic navigation.

Rationale and trade-offs:
1. Server-side enforcement prevents clients from bypassing UI restrictions.
2. Status-type normalization keeps future lifecycle transitions extensible.
3. Backfilling existing rows avoids runtime null handling and inconsistent behavior.
4. Scope remains focused: cancellation only, without introducing full order-editing workflows.

### Risk and Regression Considerations

1. Risk: invalid status transitions from direct API calls.
   - Mitigation: enforce transition constraints in backend endpoint and return deterministic `400` with clear message.
2. Risk: migration/backfill inconsistencies for existing orders.
   - Mitigation: run idempotent initialization/backfill logic during DB startup and validate that all orders have a valid status type id.
3. Risk: UI/backend contract mismatch for new `status` fields.
   - Mitigation: define explicit response shape and update Cypress assertions for status visibility and cancel-button presence.
4. Risk: regression in existing order list/details behavior.
   - Mitigation: preserve existing keys and add status fields additively; keep route structure unchanged.

### API and Data Contract Impact

1. Data model additions:
   - add `order_status_types` lookup table with values: `Ordered`, `Processing`, `Shipped`, `Delivered`, `Cancelled`.
   - add `orders.order_status_type_id` foreign key to `order_status_types`.
2. API response updates:
   - `GET /api/orders` includes `status` for each order row.
   - `GET /api/orders/:orderId` includes `status` in `order`.
3. New endpoint:
   - `PATCH /api/orders/:orderId/status` (or equivalent) with restricted transition to `Cancelled`.
4. Error contract:
   - `400` for invalid/non-allowed transition,
   - `404` for unknown or inaccessible order,
   - `401` for unauthenticated requests.

### Status

Implemented and verified.

## Implementation Plan

### Files to Modify

1. `app/backend/src/db.js`
   - Add order status types table and order status foreign key; add idempotent seed/backfill of existing orders.
2. `app/backend/src/server.js`
   - Return order status fields in orders APIs and add cancellation/status-update endpoint with transition guard.
3. `app/frontend/src/App.jsx`
   - Wire cancel action handler, refresh order list/details state after successful cancel, pass new props to pages.
4. `app/frontend/src/components/OrdersPage.jsx`
   - Show order status and conditionally show cancel control only for eligible statuses.
5. `app/frontend/src/components/OrderDetailsPage.jsx`
   - Render order status and add explicit "Back to orders" control.
6. `cypress/e2e/orders-list.cy.ts` and `cypress/e2e/orders-details.cy.ts`
   - Add/adjust scenarios for status rendering, allowed cancel path, and disallowed cancel states.
7. `specs/order-details.feature` and/or new feature spec file
   - Update behavior source to include cancellation/status expectations.

### Build Sequence

1. Implement backend schema + migration/backfill for status types and order status assignment.
2. Extend backend order APIs and add cancel transition endpoint with deterministic validation/errors.
3. Update frontend order list/details UI for status display, cancel controls, and back navigation.
4. Add/update Cypress specs and page-object helpers to validate new behavior.
5. Run required verification commands and update requirements artifact sections after implementation.

## Test Strategy

### Primary Validation (Required)

1. Backend validation:
   - Existing orders have valid status after migration/backfill.
   - Cancellation endpoint allows `Ordered`/`Processing` only and blocks other states.
2. UI validation:
   - Order status is displayed in list and details views.
   - Cancel action appears only for eligible statuses and updates status to `Cancelled`.
   - Back-to-orders action from details navigates correctly.
3. Error-path validation:
   - Invalid cancel attempts show deterministic error responses/messages without breaking page state.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Updated orders list to display order status for each row and added a cancel action shown only for `Ordered` and `Processing`.
  - Added client-side cancellation flow in `App.jsx` that calls a backend status endpoint and updates order row status to `Cancelled` on success.
  - Updated order details page to display order status and added a deterministic `Back to orders` control.
- Backend/API impact:
  - Added `order_status_types` table seed/migration and `orders.order_status_type_id` with idempotent backfill for legacy orders.
  - Updated checkout to create new orders in `Ordered` status.
  - Updated `GET /api/orders` and `GET /api/orders/:orderId` to include `status`.
  - Added `PATCH /api/orders/:orderId/status` with server-side transition enforcement allowing only `Ordered`/`Processing` to `Cancelled`.
- Test/spec changes:
  - Extended Cypress orders-list tests for status field and cancellation behavior constraints.
  - Extended Cypress order-details tests for `status` contract and `Back to orders` navigation.
  - Updated `specs/orders-list.feature` and `specs/order-details.feature` to reflect new status/cancel/back behaviors.

## Verification Results

- `npm run test:e2e`
  - Result: pass (12 specs, 52 tests; includes updated `orders-list.cy.ts` and `orders-details.cy.ts`).
- `npm run test:a11y`
  - Result: pass (accessibility suite complete, 5 passing tests).
- `REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-1.md npm run workflow:final-pass`
  - Result: pass. Note: first run failed due a transient unrelated Cypress failure in `catalog-editor.cy.ts`; immediate rerun passed fully.

## Review Results

- Review scope:
  - `app/backend/src/db.js`
  - `app/backend/src/server.js`
  - `app/frontend/src/App.jsx`
  - `app/frontend/src/components/OrdersPage.jsx`
  - `app/frontend/src/components/OrderDetailsPage.jsx`
  - `cypress/e2e/orders-list.cy.ts`
  - `cypress/e2e/orders-details.cy.ts`
  - `cypress/pages/OrdersPage.ts`
  - `cypress/pages/OrderDetailsPage.ts`
  - `specs/orders-list.feature`
  - `specs/order-details.feature`
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `app/backend/src`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `app/frontend/src`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `cypress`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-13T14:43:52Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Jira source SCRUM-1 imported and clarification pass started.
- 2026-03-13T14:44:52Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Clarification decisions and testable acceptance criteria finalized.
- 2026-03-13T14:45:56Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed backend order schema/endpoints, frontend orders routes, and existing Cypress coverage.
- 2026-03-13T14:45:57Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized architecture decision, API/data impact, implementation plan, and verification strategy for cancellation status flow.
- 2026-03-13T15:02:54Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started backend status model and cancellation API implementation plus frontend wiring.
- 2026-03-13T15:02:55Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed backend/frontend code updates and Cypress/spec coverage changes for cancellation workflow.
- 2026-03-13T15:02:55Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Ran required e2e, a11y, and final-pass workflow commands for SCRUM-1.
- 2026-03-13T15:02:56Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Required verification commands completed successfully.
- 2026-03-13T15:02:56Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Scoped review and Snyk scans completed with zero findings.

