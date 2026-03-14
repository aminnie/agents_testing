# Jira Source: SCRUM-17

- Summary: Security: Add API rate limiting for auth and checkout endpoints
- Jira Type: Story
- Jira Status: In Progress

## Original Jira Description

Context
1. This ticket was enriched for implementation readiness with explicit scope, dependencies, acceptance criteria, rollout and rollback, and verification guidance.
In Scope
1. Apply deterministic rate limits to login, register, and checkout endpoints.
2. Return standardized 429 responses with retry guidance.
3. Instrument rate-limit events for monitoring and incident response.
Out of Scope
1. Global API gateway replacement.
2. Rate limiting for unrelated low-risk endpoints in this ticket.
Dependencies
1. Security policy thresholds from SCRUM-7.
2. Observability updates for tracking throttle metrics.
Acceptance Criteria (Given/When/Then)
1. Given burst traffic to auth endpoints, when threshold is exceeded, then API returns 429 with consistent response format.
2. Given normal user behavior, when within thresholds, then no false-positive throttling occurs for valid checkout flow.
3. Given throttling events, when monitoring is reviewed, then rate-limit counters and alerts are visible.
Rollout Plan
1. Enable in staging with threshold tuning from test traffic patterns.
2. Enable in production with conservative defaults and monitor error-rate impact.
Rollback Plan
1. Disable rate-limit middleware by configuration toggle if severe user impact appears.
2. Revert to prior thresholds while incident review is in progress.
Verification
1. Automated tests cover allowed and throttled scenarios.
2. Post-deploy monitoring confirms expected throttle behavior.
3. Support playbook includes user-facing retry guidance.
Definition of Done
1. Rate limits active on scoped endpoints.
2. 429 contract documented and tested.
3. Monitoring visibility for throttling confirmed.

## Working Requirements
## Source Context

- Source system: Jira
- Source ticket/reference: SCRUM-17
- Source summary: Add deterministic endpoint-specific rate limiting for login, register, and checkout with standardized 429 response and observability hooks.

As a Product Owner, I would like to:
1. Protect auth and checkout endpoints from burst abuse.
2. Return consistent retry guidance when throttling occurs.
3. Observe throttling activity for incident response and tuning.

## Clarification Decisions

### Decisions Applied

1. Rate limiting scope is endpoint-specific and limited to `POST /api/login`, `POST /api/register`, and `POST /api/checkout`.
2. Throttle identity key will be deterministic using request IP plus endpoint path; for authenticated checkout, include `userId` when available to reduce false positives.
3. 429 response contract will be standardized as JSON: `{ message, code, retryAfterSeconds }`.
4. Retry guidance will also be returned via `Retry-After` response header.
5. Thresholds will be configurable by environment variables with safe defaults and a global enable/disable toggle for rollback.
6. Throttle events will be emitted through existing structured logging (`category=event`) for monitoring visibility.

### Requirements Updates

1. Backend must enforce fixed-window rate limits on the three scoped POST endpoints only.
2. Each limited endpoint must have independent thresholds/windows to support auth and checkout tuning separately.
3. Exceeded requests must return HTTP 429 with a consistent JSON payload and `Retry-After` header.
4. Normal request behavior within thresholds must remain unchanged (no response contract changes for success paths).
5. Rate-limit events must be logged with endpoint, key hash/token, current count, max, and retry window metadata without leaking sensitive request fields.
6. Feature must support runtime rollback via env toggle (disable middleware or set permissive thresholds).

### Acceptance Criteria Updates

1. Given burst traffic to login/register/checkout exceeding configured limits, when requests continue in the active window, then backend responds with 429 and standardized retry payload/header.
2. Given requests remain below configured thresholds, when users perform normal auth and checkout flows, then no false-positive 429 responses occur in regression tests.
3. Given throttling occurs, when backend logs are inspected, then structured throttle events are present with correlation IDs and endpoint metadata.
4. Given rate limiting is disabled by configuration, when requests are replayed, then throttling no longer occurs without code rollback.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Backend routes are centralized in `app/backend/src/server.js`, making targeted middleware attachment straightforward.
2. Structured logging and correlation IDs were recently added (SCRUM-15), providing a ready channel for throttle event instrumentation.
3. Session handling supports authenticated context for checkout (`req.userId`), enabling smarter limit keys.
4. No current rate-limiting middleware exists in backend; introducing one is additive with low contract risk.

### Architecture Decision

Implement an internal endpoint-scoped fixed-window rate limiter as middleware:

1. Add a small reusable limiter utility module in backend (`app/backend/src/security/rate-limit.js`) with:
   - in-memory counters keyed by endpoint + identity,
   - per-endpoint config (`maxRequests`, `windowSeconds`),
   - remaining/retry calculations and cleanup of expired buckets.
2. Integrate middleware on the three scoped routes only (`/api/login`, `/api/register`, `/api/checkout`).
3. Emit throttle events via existing structured logger (`logEvent`) and error paths via consistent 429 payload.
4. Parameterize thresholds and feature toggle via env vars to support staged rollout and rollback.

Rationale:
- Keeps scope tight to ticket boundaries.
- Avoids dependency churn while remaining deterministic and testable.
- Reuses established observability model for incident response.

### Risk and Regression Considerations

1. Risk: false-positive throttling affects legitimate users.
   - Mitigation: conservative defaults, endpoint-specific tuning, user-aware checkout keying.
2. Risk: memory growth from key cardinality.
   - Mitigation: window-based key expiry cleanup and small scoped route set.
3. Risk: logging leaks sensitive data in throttle events.
   - Mitigation: log only sanitized metadata (no request body, no credentials/payment details).
4. Risk: local-only in-memory limits do not synchronize across multi-instance deployments.
   - Mitigation: document current behavior and create follow-up for shared-store limiter (Redis) if needed.

## Implementation Plan

### Files to Modify

1. `app/backend/src/security/rate-limit.js` (new)
   - Implement fixed-window rate-limiter middleware and config parsing.
2. `app/backend/src/server.js`
   - Wire limiter middleware to login/register/checkout and add 429 response contract.
3. `.env.example`
   - Add rate-limit toggle and threshold/window environment variables.
4. `README.md`
   - Document configuration, 429 response format, and rollback toggle.
5. `requirements/feature_SCRUM-17.md`
   - Record implementation evidence and verification/review outcomes.

### Build Sequence

1. Implement reusable limiter utility + env-driven config.
2. Attach middleware to scoped endpoints and standardized 429 handler behavior.
3. Emit structured throttle event logs.
4. Validate with focused throttle/allow tests.
5. Run required regressions and final-pass workflow.

## Test Strategy

### Primary Validation (Required)

1. Endpoint-specific throttling validation: exceed configured limits for login/register/checkout and assert 429 payload/header contract.
2. Non-throttled validation: run normal auth + checkout flow and assert no unexpected 429 responses.
3. Observability validation: verify throttle events appear in structured logs with correlation ID and endpoint metadata.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - None in scope for SCRUM-17.
- Backend/API impact:
  - Added scoped fixed-window rate limiting module: `app/backend/src/security/rate-limit.js`.
  - Applied rate-limit middleware to:
    - `POST /api/login`
    - `POST /api/register`
    - `POST /api/checkout` (after auth middleware).
  - Added standardized 429 contract for throttled requests:
    - JSON body: `message`, `code`, `retryAfterSeconds`
    - headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
  - Added structured throttle event logging (`message=rate_limit.throttled`) with sanitized identity hash and scope metadata.
  - Added env-driven rollout/rollback controls and endpoint thresholds through `.env.example` variables.
  - Updated `README.md` with SCRUM-17 configuration, response contract, rollback guidance, and verification command.
- Test/spec changes:
  - Added unit tests for limiter behavior: `app/backend/src/security/rate-limit.test.js`.
  - Added endpoint verification script: `scripts/security/verify-rate-limit.mjs`.
  - Added npm scripts:
    - `test:rate-limit`
    - `verify:rate-limit`

## Verification Results

- `npm run test:rate-limit`
  - Result: pass (`3/3` unit tests passed).
- `BACKEND_PORT=4500 RATE_LIMIT_ENABLED=true RATE_LIMIT_LOGIN_MAX_REQUESTS=5 RATE_LIMIT_REGISTER_MAX_REQUESTS=2 RATE_LIMIT_CHECKOUT_MAX_REQUESTS=2 npx start-server-and-test "npm run dev:backend" "http://localhost:4500/health" "RATE_LIMIT_VERIFY_BASE_URL=http://localhost:4500 RATE_LIMIT_VERIFY_LOGIN_PASSWORD='CorrectHorseBatteryStaple1!' npm run verify:rate-limit"`
  - Result: pass. Verified throttling behavior across scoped endpoints:
    - login statuses: `[200, 200, 200, 200, 429, 429]`
    - register statuses: `[400, 400, 429, 429]`
    - checkout statuses: `[201, 201, 429, 429]`
- `BACKEND_PORT=4510 FRONTEND_PORT=5190 npm run test:e2e`
  - Result: pass. All 12 specs passed (57 tests).
- `BACKEND_PORT=4511 FRONTEND_PORT=5191 npm run test:a11y`
  - Result: pass. Accessibility suite passed (5 tests).
- `BACKEND_PORT=4512 FRONTEND_PORT=5192 REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-17.md npm run workflow:final-pass`
  - Result: pass. Final pass completed and published `feature_SCRUM-17.md` to Jira.

## Review Results

- Review scope:
  - `app/backend/src/security/rate-limit.js`
  - `app/backend/src/security/rate-limit.test.js`
  - `app/backend/src/server.js`
  - `scripts/security/verify-rate-limit.mjs`
  - `.env.example`
  - `README.md`
  - `package.json`
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/app/backend/src/security`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/scripts/security`: `issueCount: 0`.
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/app/backend/src/server.js`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-14T02:41:22Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Initialized Jira-backed SCRUM-17 requirements.
- 2026-03-14T02:41:22Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized scope, thresholds strategy, and 429 contract decisions.
- 2026-03-14T02:41:22Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed backend route layout and observability integration points.
- 2026-03-14T02:41:22Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Defined implementation blueprint for endpoint-scoped fixed-window limiting.
- 2026-03-14T02:41:22Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began fixed-window limiter implementation and endpoint integration.
- 2026-03-14T02:53:33Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed scoped middleware, 429 contract, config variables, and docs updates.
- 2026-03-14T02:45:43Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started rate-limit verification and required regression gates.
- 2026-03-14T02:52:08Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed unit/endpoint checks, e2e, a11y, and workflow final pass.
- 2026-03-14T02:53:33Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed scoped security scans and implementation review.

