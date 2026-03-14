# Jira Source: SCRUM-20

- Summary: Containerize frontend runtime with backend proxy target support
- Jira Type: Story
- Jira Status: To Do

## Original Jira Description

Create frontend container runtime and configurable API proxy target so frontend can call backend reliably inside compose networking.

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-20
- Source summary: Containerize frontend runtime with backend proxy target support.

As a platform owner, I would like to:
1. Run the frontend in a containerized runtime.
2. Configure frontend API proxy behavior for both host and container networking.
3. Attach implementation evidence to the story post-delivery.

## Clarification Decisions

### Decisions Applied

1. Frontend runtime is delivered through `app/frontend/Dockerfile`.
2. Vite proxy uses `BACKEND_PROXY_TARGET` for container-network compatibility.
3. Compose frontend service depends on healthy backend service.

### Requirements Updates

1. Frontend container must expose port `5173` with host-port override support.
2. API proxy target must be configurable by environment variable.
3. Compose health checks must validate frontend HTTP readiness.

### Acceptance Criteria Updates

1. Frontend image builds and starts via compose app profile.
2. Frontend successfully serves HTTP response on mapped host port.
3. API proxy target config supports backend service DNS (`backend`) in container mode.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Frontend previously ran only on host via `npm run dev:frontend`.
2. Proxy config was fixed to localhost backend and not container-aware.

### Architecture Decision

Add `app/frontend/Dockerfile` and update `vite.config.js` to resolve backend proxy through `BACKEND_PROXY_TARGET`, with defaults preserving host-based developer flow.

### Risk and Regression Considerations

1. Incorrect proxy target could break frontend API calls in containerized mode.
2. Mitigation: default target remains localhost for host runs; compose sets target to backend service host.

## Implementation Plan

### Files to Modify

1. `app/frontend/Dockerfile`
   - Added frontend container build/runtime definition.
2. `app/frontend/vite.config.js`
   - Added configurable backend proxy target.
3. `docker-compose.yml`
   - Added frontend service wiring and healthcheck.
4. `requirements/feature_SCRUM-20.md`
   - Backfilled implementation and verification evidence.

### Build Sequence

1. Add frontend Dockerfile and compose service configuration.
2. Add environment-driven proxy target support in Vite.
3. Validate frontend endpoint and record evidence.

## Test Strategy

### Primary Validation (Required)

1. `npm run app:config`
2. `BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up`
3. Probe `http://localhost:5188`

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Added frontend container runtime (`app/frontend/Dockerfile`).
  - Added backend proxy target environment support in `vite.config.js`.
- Backend/API impact:
  - None direct to backend business logic.
- Test/spec changes:
  - Verified frontend container endpoint and integrated app startup checks.

## Verification Results

- `npm run app:config`
  - Result: pass.
- `BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up`
  - Result: pass with containerized frontend startup.
- `node -e "<frontend probe>"`
  - Result: pass (`http://localhost:5188` returned 200).

## Review Results

- Review scope:
  - `app/frontend/Dockerfile`, `app/frontend/vite.config.js`, `docker-compose.yml`.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `app/frontend/vite.config.js`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-14T03:28:12Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Backfill initiated for SCRUM-20 after implementation was completed.
- 2026-03-14T03:28:12Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Confirmed frontend containerization evidence mapping.
- 2026-03-14T03:28:12Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed delivered frontend container and proxy changes.
- 2026-03-14T03:28:12Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized acceptance and verification details.
- 2026-03-14T03:28:12Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Implementation already shipped in commit `7666c4f`; recording backfill evidence.
- 2026-03-14T03:28:12Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Frontend container runtime and proxy config delivered.
- 2026-03-14T03:28:12Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Executed compose and endpoint checks.
- 2026-03-14T03:28:12Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Frontend startup and HTTP endpoint checks passed.
- 2026-03-14T03:28:12Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized backfill and ready for Jira attachment publish.

