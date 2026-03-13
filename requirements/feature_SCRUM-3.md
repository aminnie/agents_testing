# Jira Source: SCRUM-3

- Summary: Feature: Add reason to cancel order instruction
- Jira Type: Task
- Jira Status: To Do

## Original Jira Description

As the store Product Owner, I would like the ability to add a free text reason for cancelling an order.

1. Upon cancelling request:
1.1. Present the user with a modal request a reason input.
1.2 Add a Proceed button that saves the cancellation request text on the order and then proceed to cancel.
1.3 Add an option to modal to Cancel the cancellation request, and do not proceed with the cancel function.

## Working Requirements
## Source Context

- Source system: Jira
- Source ticket/reference: SCRUM-3
- Source summary: Require a user-provided cancellation reason through a confirmation modal before cancelling an eligible order.

As a Product Owner, I would like to:
1. Require a user to provide a free-text reason when cancelling an eligible order.
2. Present cancellation confirmation in a modal with explicit Proceed and Cancel actions.
3. Persist the entered cancellation reason on the cancelled order record.

## Clarification Decisions

### Decisions Applied

1. Clicking `Cancel order` no longer cancels immediately; it opens a modal that contains a free-text reason field.
2. The cancellation reason is mandatory for `Proceed`:
   - empty or whitespace-only values are invalid,
   - `Proceed` must remain disabled until a non-empty trimmed reason is present.
3. Modal actions are explicit and mutually exclusive:
   - `Proceed` saves the reason and submits cancellation,
   - `Cancel` closes the modal and performs no cancellation mutation.
4. Reason text is normalized before persistence:
   - leading/trailing whitespace is trimmed,
   - internal line breaks/spacing are preserved as entered.
5. Existing cancellation eligibility rules remain unchanged:
   - only orders in `Ordered` or `Processing` can be cancelled.
6. Backend contract is extended to include cancellation reason in the cancellation request payload and persist it on the order row.

### Requirements Updates

1. On the orders list page, selecting `Cancel order` for an eligible order must open a cancellation-reason modal.
2. The modal must include:
   - a reason input field,
   - a `Proceed` action,
   - a `Cancel` action.
3. `Proceed` must only be allowed when reason input has at least one non-whitespace character.
4. On `Proceed`, the system must:
   - submit cancellation request with the provided reason,
   - persist the reason on the order record,
   - update order status to `Cancelled` on success.
5. On modal `Cancel`, the modal must close and the order status/reason must remain unchanged.
6. If cancellation fails, the user must receive deterministic error feedback and the order must remain in its prior state.
7. The implementation must preserve current non-eligible-order behavior (no cancellation action offered for disallowed statuses).

### Acceptance Criteria Updates

1. Given an order in `Ordered` or `Processing`, when the user clicks `Cancel order`, then a modal with reason input and `Proceed`/`Cancel` controls is displayed.
2. Given the modal is open and reason is empty or whitespace-only, when the user attempts to proceed, then cancellation is not submitted and `Proceed` is disabled.
3. Given the modal contains a valid reason, when `Proceed` is clicked, then the cancellation API request includes the reason and the order status updates to `Cancelled` on success.
4. Given the modal is open, when `Cancel` is clicked, then the modal closes and no cancellation API request is sent.
5. Given cancellation API returns an error, when `Proceed` is clicked, then the UI shows deterministic error messaging and keeps the order in its original status.
6. Given a non-eligible order status (`Shipped`, `Delivered`, or already `Cancelled`), when orders render, then no cancel action is shown for that order.

### Blocking Questions

None.

### Status

Ready for implementation approval

## Technical Analysis

### Current State Observations

1. Orders cancellation is currently immediate from list-row action in `app/frontend/src/components/OrdersPage.jsx`, with no modal or reason input.
2. Frontend cancellation API call in `app/frontend/src/App.jsx` sends only `{ status: "Cancelled" }` to `PATCH /api/orders/:orderId/status`.
3. Backend cancellation endpoint in `app/backend/src/server.js` validates status eligibility and updates only `order_status_type_id`; no cancellation reason is accepted or persisted.
4. Orders table schema in `app/backend/src/db.js` currently has no cancellation reason column and no migration path for it.
5. Existing Cypress orders tests cover eligibility and cancellation status update behavior but do not cover reason-required modal workflow.

### Architecture Decision

Implement cancellation reason as part of the existing cancellation flow by adding a modal-driven frontend step and extending the current cancellation endpoint contract.

Decision details:
1. Backend/API (`app/backend/src/server.js`)
   - Extend `PATCH /api/orders/:orderId/status` to accept `reason` when `status === "Cancelled"`.
   - Validate `reason` as required for cancellation:
     - non-empty after trim,
     - printable text only,
     - maximum length cap (recommended: 300 chars) for predictable storage and UX.
   - Persist normalized reason on order record in same cancellation update operation.
2. Data layer (`app/backend/src/db.js`)
   - Add order column migration: `cancellation_reason TEXT`.
   - Keep backwards compatibility for existing rows (nullable for historical orders).
3. Frontend (`app/frontend/src/App.jsx` + `app/frontend/src/components/OrdersPage.jsx`)
   - Replace direct row-button cancellation with modal flow:
     - open modal with reason textarea/input on cancel click,
     - disable `Proceed` until reason is valid,
     - `Cancel` closes modal with no API request.
   - On `Proceed`, call existing endpoint with payload `{ status: "Cancelled", reason: <normalized reason> }`.
   - Preserve existing status eligibility logic and error handling semantics.
4. Response/read model
   - Keep orders-list response shape unchanged to avoid unnecessary broad regression risk.
   - Include persisted cancellation reason in order details endpoint response for future observability (recommended scope in same feature implementation).

### Risk and Regression Considerations

1. **Risk:** Modal state bugs could submit stale reason or wrong order id.
   - **Mitigation:** Store modal state with explicit `activeOrderId`; clear reason/error state on modal close and on successful submit.
2. **Risk:** Existing cancel tests regress because request body contract changed.
   - **Mitigation:** Update Cypress intercept assertions to expect `reason` and add coverage for modal `Cancel` no-op path.
3. **Risk:** Unbounded free-text input increases storage and validation inconsistency.
   - **Mitigation:** Enforce backend length and character validation; mirror constraints in frontend input for fast feedback.
4. **Risk:** Partial update where status changes but reason not persisted.
   - **Mitigation:** Perform single SQL update statement setting both status and reason; fail request if reason validation fails.
5. **Risk:** Accessibility regressions from new modal interactions.
   - **Mitigation:** Use MUI dialog semantics with labeled input and focus-trap defaults; include a11y run in verification.

## Implementation Plan

### Files to Modify

1. `app/backend/src/db.js`
   - Add `cancellation_reason` migration column for `orders`.
2. `app/backend/src/server.js`
   - Extend cancellation endpoint validation and persistence for reason.
   - Optionally expose `cancellationReason` in order-details response.
3. `app/frontend/src/App.jsx`
   - Add modal/cancellation-reason state and handler wiring.
   - Send cancellation reason in patch request payload.
4. `app/frontend/src/components/OrdersPage.jsx`
   - Add cancellation modal UI with reason input, `Proceed`, and `Cancel`.
   - Bind modal actions to provided handlers and loading/error states.
5. `cypress/pages/OrdersPage.ts`
   - Add page-object selectors/actions for cancellation modal and reason input.
6. `cypress/e2e/orders-list.cy.ts`
   - Add/adjust specs for required reason, proceed flow, cancel-noop flow, and failure messaging.
7. `specs/orders-list.feature`
   - Add scenario language for modal reason capture behavior.
8. `requirements/feature_SCRUM-3.md`
   - Update `## What Changed`, verification, review, and timeline during implementation/final pass.

### Build Sequence

1. Add DB migration support for `cancellation_reason`.
2. Extend backend cancellation endpoint request validation and persistence.
3. Implement frontend modal UX and hook into cancellation handler.
4. Update/expand Cypress page object and orders list tests.
5. Run required validation scripts and capture results in requirements artifact.

## Test Strategy

### Primary Validation (Required)

1. API validation
   - `PATCH /api/orders/:orderId/status` with `{ status: "Cancelled", reason: "..." }` succeeds for eligible orders.
   - Missing/whitespace-only reason returns deterministic `400` and does not change status.
   - Ineligible statuses still return deterministic cancellation rejection.
2. UI behavior validation
   - Cancel action opens modal with reason input and `Proceed`/`Cancel`.
   - `Proceed` disabled until valid reason.
   - `Cancel` closes modal and does not call cancellation endpoint.
   - Successful proceed updates row status to `Cancelled`.
3. Regression validation
   - Existing orders pagination/search behavior remains intact.
   - Order details navigation continues to function.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Added cancellation-reason modal flow on orders list with required free-text input before cancellation can proceed.
  - Added modal `Proceed` and `Cancel` actions with deterministic behavior:
    - `Proceed` disabled until non-whitespace reason is provided.
    - `Cancel` closes modal and does not send cancellation request.
  - Updated cancellation submit path to send reason payload and keep existing status update behavior.
- Backend/API impact:
  - Extended cancellation endpoint `PATCH /api/orders/:orderId/status` to require and validate `reason` for `Cancelled` status.
  - Added cancellation reason validation controls:
    - required after trim,
    - max length 300,
    - supported-character validation.
  - Persisted cancellation reason to orders table and returned `cancellationReason` in cancellation response and order details response.
  - Added DB migration column: `orders.cancellation_reason`.
- Test/spec changes:
  - Updated `specs/orders-list.feature` with cancellation-reason modal scenarios (proceed and cancel-noop paths).
  - Updated `cypress/e2e/orders-list.cy.ts` to validate:
    - required reason gating,
    - payload includes `reason`,
    - modal cancel sends no API request.
  - Updated `cypress/pages/OrdersPage.ts` with modal selectors/actions.
  - Updated `cypress/e2e/orders-details.cy.ts` assertions for new `cancellationReason` field in order details response.

## Verification Results

- `BACKEND_PORT=4100 FRONTEND_PORT=5175 npx start-server-and-test "npm run dev:backend" "http://localhost:4100/health" "npm run dev:frontend" "http://localhost:5175" "npm run cypress:run -- --spec cypress/e2e/orders-list.cy.ts,cypress/e2e/orders-details.cy.ts"`
  - Result: pass (10 passing, 0 failing).
- `BACKEND_PORT=4100 FRONTEND_PORT=5175 npm run test:e2e`
  - Result: pass (55 passing, 0 failing).
- `BACKEND_PORT=4100 FRONTEND_PORT=5175 npm run test:a11y`
  - Result: pass (5 passing, 0 failing).
- `BACKEND_PORT=4100 FRONTEND_PORT=5175 npm run workflow:final-pass`
  - Result: pass; final pass completed and resolved artifact `requirements/feature_SCRUM-3.md`.

## Review Results

- Review scope:
  - `app/backend/src/db.js`
  - `app/backend/src/server.js`
  - `app/frontend/src/App.jsx`
  - `app/frontend/src/components/OrdersPage.jsx`
  - `cypress/pages/OrdersPage.ts`
  - `cypress/e2e/orders-list.cy.ts`
  - `cypress/e2e/orders-details.cy.ts`
  - `specs/orders-list.feature`
  - `requirements/feature_SCRUM-3.md`
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

- 2026-03-13T16:29:11Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Jira clarification workflow started for SCRUM-3.
- 2026-03-13T16:29:11Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Clarification decisions finalized with testable modal cancellation-reason behavior.
- 2026-03-13T16:40:08Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed current cancellation UI/API/schema behavior for gap analysis.
- 2026-03-13T16:40:08Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized architecture, migration, risk controls, and validation plan.
- 2026-03-13T16:40:08Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began cancellation-reason modal and endpoint/schema implementation.
- 2026-03-13T16:52:40Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Delivered backend/frontend/test/spec updates for cancellation-reason workflow.
- 2026-03-13T16:52:40Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Executed targeted and required regression/a11y/final-pass validations.
- 2026-03-13T16:52:40Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | All targeted, full e2e, accessibility, and final-pass checks passed.
- 2026-03-13T16:52:40Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Security scan clean and review findings at zero across severities.

