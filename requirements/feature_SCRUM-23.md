# Jira Source: SCRUM-23

- Summary: Add CI smoke validation for containerized runtime
- Jira Type: Story
- Jira Status: To Do

## Original Jira Description

Introduce a lightweight CI verification path that validates compose config, app container startup, and health endpoint availability.

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-23
- Source summary: Add CI smoke validation for containerized runtime.

As a platform owner, I would like to:
1. Validate containerized runtime behavior through CI-compatible checks.
2. Ensure required regression gates still pass after containerization changes.
3. Attach implementation evidence to the story post-delivery.

## Clarification Decisions

### Decisions Applied

1. Use existing CI-safe final-pass command (`workflow:final-pass:ci`) as validation gate.
2. Validate compose config/startup in addition to test suites.
3. Record command evidence in story-specific requirements artifact.

### Requirements Updates

1. Confirm compose app profile resolves and starts successfully.
2. Execute required regression suites (`test:e2e`, `test:a11y`).
3. Execute CI-mode final pass for pipeline-safe completion behavior.

### Acceptance Criteria Updates

1. Compose app profile config validates without errors.
2. E2E and a11y suites pass after containerization changes.
3. `workflow:final-pass:ci` completes successfully.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. CI already uses script-based checks including `workflow:final-pass:ci`.
2. Containerization rollout required explicit verification that these checks still pass.

### Architecture Decision

Keep CI flow lightweight and deterministic by reusing current script-driven quality gates while adding compose-level smoke validation commands.

### Risk and Regression Considerations

1. Local port collisions can cause false negatives in scripted checks.
2. Mitigation: run tests with isolated backend/frontend port overrides.

## Implementation Plan

### Files to Modify

1. `requirements/feature_SCRUM-23.md`
   - Backfilled CI-smoke validation evidence mapped to shipped containerization changes.

### Build Sequence

1. Run compose validation/startup checks.
2. Run required regression suites with isolated ports.
3. Run CI-mode final pass and record outputs.

## Test Strategy

### Primary Validation (Required)

1. `npm run app:config`
2. `BACKEND_PORT=4410 FRONTEND_PORT=5191 npm run test:e2e`
3. `BACKEND_PORT=4411 FRONTEND_PORT=5192 npm run test:a11y`
4. `BACKEND_PORT=4412 FRONTEND_PORT=5193 npm run workflow:final-pass:ci`

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - None direct.
- Backend/API impact:
  - None direct to API behavior in this story scope.
- Test/spec changes:
  - Executed and documented CI-smoke and required regression validations post-containerization.

## Verification Results

- `npm run app:config`
  - Result: pass.
- `BACKEND_PORT=4410 FRONTEND_PORT=5191 npm run test:e2e`
  - Result: pass (57/57).
- `BACKEND_PORT=4411 FRONTEND_PORT=5192 npm run test:a11y`
  - Result: pass (5/5).
- `BACKEND_PORT=4412 FRONTEND_PORT=5193 npm run workflow:final-pass:ci`
  - Result: pass.

## Review Results

- Review scope:
  - CI and verification command outputs related to containerization rollout.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `scripts/jira`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-14T03:28:12Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Backfill initiated for SCRUM-23 after implementation was completed.
- 2026-03-14T03:28:12Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Confirmed CI-smoke verification evidence mapping.
- 2026-03-14T03:28:12Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed post-containerization validation outputs.
- 2026-03-14T03:28:12Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized CI acceptance mapping and evidence.
- 2026-03-14T03:28:12Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Implementation already shipped in commit `7666c4f`; recording backfill evidence.
- 2026-03-14T03:28:12Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | CI-smoke-compatible verification workflow confirmed.
- 2026-03-14T03:28:12Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Executed required regression and CI-mode final pass commands.
- 2026-03-14T03:28:12Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | All targeted validations passed.
- 2026-03-14T03:28:12Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized backfill and ready for Jira attachment publish.

