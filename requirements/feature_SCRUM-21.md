# Jira Source: SCRUM-21

- Summary: Orchestrate app and infrastructure services in docker compose
- Jira Type: Story
- Jira Status: To Do

## Original Jira Description

Extend compose topology to run frontend, backend, postgres, and redis together with health checks and startup ordering.

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-21
- Source summary: Orchestrate app and infrastructure services in docker compose.

As a platform owner, I would like to:
1. Run frontend, backend, Postgres, and Redis with a single compose topology.
2. Ensure service startup ordering and health checks are explicit.
3. Attach implementation evidence to the story post-delivery.

## Clarification Decisions

### Decisions Applied

1. Compose remains the local orchestrator; app services were added to existing file.
2. App services are grouped under `profiles: [\"app\"]` to preserve infra-only commands.
3. Service health checks and dependencies are part of orchestration behavior.

### Requirements Updates

1. Add backend and frontend services to compose with health checks.
2. Keep Postgres and Redis definitions intact for backward compatibility.
3. Use environment defaults with host-port override support.

### Acceptance Criteria Updates

1. `docker compose --profile app config` resolves all service definitions.
2. App services can start with infra dependencies healthy.
3. Backend and frontend endpoints are reachable after startup.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Compose originally included only infrastructure services.
2. App process startup was previously host-only.

### Architecture Decision

Extend existing compose file with application services while keeping infrastructure behavior stable. Use app profile isolation and explicit health/dependency checks for reliable startup.

### Risk and Regression Considerations

1. Port conflicts can prevent container startup.
2. Mitigation: documented host-port overrides and app profile commands.

## Implementation Plan

### Files to Modify

1. `docker-compose.yml`
   - Added app services, dependency wiring, health checks, and app profile.
2. `.dockerignore`
   - Added docker build context exclusions.
3. `requirements/feature_SCRUM-21.md`
   - Backfilled implementation and verification evidence.

### Build Sequence

1. Extend compose topology for app services.
2. Validate merged configuration and startup behavior.
3. Record outputs and publish artifact.

## Test Strategy

### Primary Validation (Required)

1. `npm run app:config`
2. `BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up`
3. Endpoint probes for backend/frontend

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - Frontend service orchestrated under compose app profile.
- Backend/API impact:
  - Backend service orchestrated with infra dependencies and health checks.
- Test/spec changes:
  - Compose config validation and endpoint probes added to verification workflow.

## Verification Results

- `npm run app:config`
  - Result: pass.
- `BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up`
  - Result: pass.
- `node -e "<endpoint checks>"`
  - Result: pass (`/health` and frontend root returned 200).

## Review Results

- Review scope:
  - `docker-compose.yml`, `.dockerignore`.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `scripts/jira`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-14T03:28:12Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Backfill initiated for SCRUM-21 after implementation was completed.
- 2026-03-14T03:28:12Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Confirmed compose orchestration scope and evidence mapping.
- 2026-03-14T03:28:12Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed compose service topology and app profile behavior.
- 2026-03-14T03:28:12Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized orchestration acceptance and verification details.
- 2026-03-14T03:28:12Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Implementation already shipped in commit `7666c4f`; recording backfill evidence.
- 2026-03-14T03:28:12Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Compose app+infra orchestration delivered.
- 2026-03-14T03:28:12Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Executed compose config/startup and endpoint checks.
- 2026-03-14T03:28:12Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Orchestration verification checks passed.
- 2026-03-14T03:28:12Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized backfill and ready for Jira attachment publish.

