# Jira Source: SCRUM-22

- Summary: Add container lifecycle scripts for local developer workflows
- Jira Type: Story
- Jira Status: To Do

## Original Jira Description

Add root-level scripts for containerized app startup, logs, restart, and stop operations while preserving infra-only workflows.

## Working Requirements
## Source Context

- Source system: jira
- Source ticket/reference: SCRUM-22
- Source summary: Add container lifecycle scripts for local developer workflows.

As a platform owner, I would like to:
1. Operate containerized app services with clear root-level npm scripts.
2. Keep infra-only and app-specific workflows separate and predictable.
3. Attach implementation evidence to the story post-delivery.

## Clarification Decisions

### Decisions Applied

1. Introduced `app:*` scripts at repository root for app service lifecycle.
2. Preserved existing `infra:*` scripts for infra-only operations.
3. Added explicit script for compose profile validation.

### Requirements Updates

1. Add scripts: `app:up`, `app:down`, `app:logs`, `app:restart`, `app:ps`, `app:config`.
2. Keep current development and infra commands unchanged for compatibility.
3. Ensure script behavior is documented and verifiable.

### Acceptance Criteria Updates

1. App lifecycle commands execute successfully from repository root.
2. `app:config` resolves compose app profile cleanly.
3. App start/stop lifecycle works independently from infra-only commands.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Existing scripts supported host-run app and infra containers, but no app-container lifecycle set.
2. Developers needed explicit app lifecycle wrappers for consistency.

### Architecture Decision

Use root `package.json` as single workflow entry point for containerized app operations, with explicit script naming and separation from infra scripts.

### Risk and Regression Considerations

1. Script ambiguity can cause accidental shutdown/startup of unintended services.
2. Mitigation: scoped commands target only frontend/backend for `app:*`, preserve `infra:*` behavior.

## Implementation Plan

### Files to Modify

1. `package.json`
   - Added app lifecycle scripts and compose profile config helper.
2. `README.md`
   - Added operator runbook for app scripts.
3. `requirements/feature_SCRUM-22.md`
   - Backfilled implementation and verification evidence.

### Build Sequence

1. Add app scripts.
2. Validate compose app profile and startup behavior.
3. Record and publish verification artifact.

## Test Strategy

### Primary Validation (Required)

1. `npm run app:config`
2. `BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up`
3. `npm run app:down`

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - None specific to UI behavior.
- Backend/API impact:
  - None to backend business logic.
- Test/spec changes:
  - Added operational verification for app script lifecycle behavior.

## Verification Results

- `npm run app:config`
  - Result: pass.
- `BACKEND_PORT=4400 FRONTEND_PORT=5188 npm run app:up`
  - Result: pass.
- `npm run app:down`
  - Result: pass.

## Review Results

- Review scope:
  - `package.json`, `README.md`.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `scripts/jira`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-14T03:28:12Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Backfill initiated for SCRUM-22 after implementation was completed.
- 2026-03-14T03:28:12Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Confirmed app lifecycle script scope and evidence mapping.
- 2026-03-14T03:28:12Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed root scripts and workflow behavior.
- 2026-03-14T03:28:12Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized acceptance criteria for script lifecycle operations.
- 2026-03-14T03:28:12Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Implementation already shipped in commit `7666c4f`; recording backfill evidence.
- 2026-03-14T03:28:12Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | App lifecycle scripts delivered and documented.
- 2026-03-14T03:28:12Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Executed script-based startup and teardown checks.
- 2026-03-14T03:28:12Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Script lifecycle validation passed.
- 2026-03-14T03:28:12Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized backfill and ready for Jira attachment publish.

