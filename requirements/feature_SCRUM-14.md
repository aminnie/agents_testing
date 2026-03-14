# Jira Source: SCRUM-14

- Summary: Scalability: Postgres migration spike and target schema plan
- Jira Type: Story
- Jira Status: To Do

## Original Jira Description

Context
1. This ticket was enriched for implementation readiness with explicit scope, dependencies, acceptance criteria, rollout and rollback, and verification guidance.
In Scope
1. Map SQLite schema and behavior to Postgres-compatible target model.
2. Define migration sequence, data validation checks, and compatibility risks.
3. Produce cutover strategy with fallback and rollback mechanics.
Out of Scope
1. Full production data migration execution.
2. Non-persistence feature changes.
Dependencies
1. Platform database provisioning and network access.
2. Session and data architecture alignment from SCRUM-8 efforts.
Acceptance Criteria (Given/When/Then)
1. Given current SQLite schema, when analysis completes, then a Postgres target schema and mapping document is approved.
2. Given migration sequencing, when reviewed, then plan includes rehearsal steps, validation checkpoints, and failure handling.
3. Given cutover requirements, when readiness is assessed, then rollback approach and consistency safeguards are documented.
Rollout Plan
1. Run migration rehearsal in staging snapshot first.
2. Execute phased cutover plan with read and write validation checkpoints.
Rollback Plan
1. Revert traffic to SQLite path for defined fallback window.
2. Restore from verified backup snapshot if integrity checks fail.
Verification
1. Schema parity checklist completed.
2. Data integrity spot-check report attached.
3. Performance baseline comparison captured for key queries.
Definition of Done
1. Migration strategy document approved.
2. Risk register and mitigations finalized.
3. Execution readiness checklist published.

## Working Requirements
## Source Context

- Source system: Jira
- Source ticket/reference: SCRUM-14
- Source summary: Perform a Postgres migration spike and produce an approved target schema, migration sequence, and rollback-ready cutover plan.

As a Product Owner, I would like to:
1. Validate that current SQLite-backed data model can be migrated safely to Postgres.
2. Produce an implementation-ready migration strategy without forcing production cutover in this ticket.
3. Keep all spike outputs runnable and testable on a laptop (Docker-based infra accepted).

## Clarification Decisions

### Decisions Applied

1. SCRUM-14 will remain a **migration spike + plan** ticket: no irreversible production switch in this scope.
2. Deliverables must include a concrete **Postgres target schema mapping** from current SQLite tables/constraints/indexes.
3. Deliverables must include executable **migration/rehearsal scripts** for local/staging validation, not just prose.
4. Validation must include schema parity checks, sample data transfer checks, and performance spot checks on key read paths.
5. Rollback strategy must be defined as operational steps with checkpoints (fallback to SQLite path + backup/restore plan).
6. Local development should run Postgres via Docker Compose services already introduced in prior ticket work.

### Requirements Updates

1. The repository must contain a documented Postgres target schema specification that maps all active SQLite tables (`users`, `role_types`, `order_status_types`, `catalog_items`, `orders`, `order_items`) including keys and indexes.
2. A migration spike toolchain must be added to extract and transform SQLite data into Postgres-compatible inserts/loads for rehearsal.
3. A verification script/checklist must validate row counts and key relational integrity between SQLite source and Postgres target.
4. The migration plan must define phased rollout checkpoints and rollback actions, including criteria for aborting cutover.
5. The ticket must avoid production write-path switching; existing app behavior remains SQLite-backed after this spike.
6. Requirements artifact must capture actual commands run, outcomes, and residual risks.

### Acceptance Criteria Updates

1. Given the current SQLite schema, when spike work completes, then a Postgres target schema document and executable schema setup script are present in-repo.
2. Given representative local data, when migration rehearsal runs, then data loads into Postgres successfully with no blocking type/constraint failures.
3. Given rehearsal completion, when parity checks are executed, then row counts match for core tables and integrity checks pass for critical foreign-key relationships.
4. Given migration planning review, when evaluated, then rollout checkpoints, abort criteria, and rollback steps are explicit and actionable.
5. Given this ticket scope, when implementation is complete, then application runtime remains functional using current SQLite path with no regression.

### Blocking Questions

1. None.

### Status

Implementation completed. Ready for handoff.

## Technical Analysis

### Current State Observations

1. Current persistence is SQLite-only in `app/backend/src/db.js`, including table creation, additive migrations, and seed/backfill behavior at startup.
2. Runtime currently couples schema evolution with app startup, which is unsafe for multi-instance database transitions.
3. Existing API behavior depends on SQL semantics that differ between SQLite and Postgres (text handling, autogenerated IDs, conflict/update idioms).
4. Docker Compose now provisions local Postgres/Redis, enabling realistic migration rehearsal on laptop without changing app runtime driver immediately.
5. SCRUM-12/13 introduced session scalability baseline; data layer remains the principal scaling bottleneck.

### Architecture Decision

Use a two-track migration spike approach:

1. **Schema track**
   - Define Postgres DDL for all active domain tables and required indexes.
   - Normalize data types and constraints for Postgres correctness (for example, integer, text, timestamps, FK constraints, unique indexes).
2. **Data movement track**
   - Add a one-off migration rehearsal script that reads SQLite and writes to Postgres in deterministic order.
   - Include id-preserving inserts where needed to maintain relationship consistency in rehearsal.
3. **Verification track**
   - Add parity checks (row counts + key integrity assertions + sample query spot-checks).
4. **Operational planning track**
   - Document staged cutover sequence, freeze points, smoke checks, and rollback path.

Rationale:
- Produces actionable migration readiness artifacts while preserving current app stability.
- Reduces risk by validating data and constraints before runtime driver changes.
- Keeps scope aligned with Jira spike intent and dependencies.

### Risk and Regression Considerations

1. **Risk:** Type/constraint mismatches between SQLite and Postgres break migration.
   - **Mitigation:** Run schema-first rehearsal and pre-load validation for columns/FKs/indexes.
2. **Risk:** Seed/backfill startup logic in current SQLite path is not directly portable.
   - **Mitigation:** Keep app runtime unchanged in this ticket; migration scripts explicitly control order/transform rules.
3. **Risk:** Partial data load could leave invalid Postgres rehearsal state.
   - **Mitigation:** Run migration in transactional phases where possible and provide cleanup/reset command.
4. **Risk:** Scope creep into full production DB switch.
   - **Mitigation:** Explicitly keep runtime DB driver unchanged; capture follow-up tickets for cutover phase.

## Implementation Plan

### Files to Modify

1. `requirements/feature_SCRUM-14.md`
   - Complete clarification/analysis and final implementation evidence.
2. `scripts/migrations/` (new, proposed)
   - Add schema initialization and SQLite-to-Postgres rehearsal scripts.
3. `app/backend/` docs or migration notes file (new, proposed)
   - Add mapping notes and operational runbook for rollout/rollback.
4. `README.md`
   - Add migration rehearsal commands and verification flow for local Postgres.
5. Optional: `package.json`
   - Add helper scripts for migration schema setup, rehearsal run, and parity checks.

### Build Sequence

1. Inventory and map existing SQLite schema to target Postgres schema.
2. Implement Postgres schema creation script.
3. Implement SQLite export/load rehearsal script.
4. Implement parity validation checks (counts + key integrity + spot queries).
5. Document operational rollout/rollback runbook.
6. Run required regression gates to ensure no app regressions.

## Test Strategy

### Primary Validation (Required)

1. Schema validation
   - Postgres DDL applies successfully on clean local container.
2. Data rehearsal validation
   - SQLite source migrates to Postgres target with no fatal load errors.
3. Parity validation
   - Table-level row counts match and key relationship checks pass.
4. Runtime regression validation
   - Existing SQLite-backed app flows remain green after spike artifacts are added.

### Regression Coverage

1. `npm run test:e2e`
2. `npm run test:a11y`
3. `npm run workflow:final-pass` (set `REQUIREMENTS_REVIEW_PATH` if needed)

## What Changed

- Frontend/UI updates shipped:
  - None in scope for SCRUM-14 migration spike.
- Backend/API impact:
  - Added Postgres migration spike tooling under `app/backend/scripts/migrations/`:
    - `apply-postgres-schema.mjs` for target schema setup.
    - `rehearse-sqlite-to-postgres.mjs` for deterministic SQLite-to-Postgres load rehearsal.
    - `check-parity.mjs` for row-count and foreign-key integrity verification.
    - `benchmark-read-queries.mjs` for query timing baseline capture.
  - Added shared migration DB client utilities in `app/backend/scripts/migrations/lib/clients.mjs`.
  - Added migration scripts in `app/backend/package.json` and root `package.json` wrappers (`db:pg:*`).
  - Added migration mapping + operational runbook doc in `app/backend/docs/postgres-migration-plan.md`.
  - Updated `README.md` with migration spike commands, required env vars, and alternate-port guidance.
- Test/spec changes:
  - No Cypress spec behavior changes required; regression coverage executed unchanged.
  - Added migration verification command flow and generated baseline artifact at `reports/migration/performance-baseline.json`.

## Verification Results

- `PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH" npm run infra:down && POSTGRES_PORT=55432 npm run infra:up`
  - Result: pass; local Postgres/Redis containers started with Postgres mapped to `55432` to avoid collision with host-local Postgres on `5432`.
- `POSTGRES_HOST=localhost POSTGRES_PORT=55432 POSTGRES_DB=happyvibes POSTGRES_USER=happyvibes POSTGRES_PASSWORD=happyvibes npm run db:pg:spike`
  - Result: pass; schema apply, data rehearsal, parity checks, and benchmark all completed.
  - Key counts: `role_types=4`, `order_status_types=5`, `users=73`, `catalog_items=195`, `orders=528`, `order_items=550`.
  - Parity/integrity checks: all match, zero FK violations.
- `BACKEND_PORT=4300 FRONTEND_PORT=5176 npm run test:e2e`
  - Result: pass; all 12 specs passed (57 tests total), PDF report generated.
- `BACKEND_PORT=4301 FRONTEND_PORT=5177 npm run test:a11y`
  - Result: pass; accessibility suite passed (5 tests).
- `REQUIREMENTS_REVIEW_PATH=requirements/feature_SCRUM-14.md npm run workflow:final-pass`
  - Result: pass; final pass completed and published `feature_SCRUM-14.md` to Jira `SCRUM-14`.
  - Note: environment had an existing process on `:4000`; final-pass still completed successfully using the active backend process.

## Review Results

- Review scope:
  - `app/backend/scripts/migrations/lib/clients.mjs`
  - `app/backend/scripts/migrations/apply-postgres-schema.mjs`
  - `app/backend/scripts/migrations/rehearse-sqlite-to-postgres.mjs`
  - `app/backend/scripts/migrations/check-parity.mjs`
  - `app/backend/scripts/migrations/benchmark-read-queries.mjs`
  - `app/backend/docs/postgres-migration-plan.md`
  - `README.md`, `package.json`, `app/backend/package.json`
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing/app/backend/scripts/migrations`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-14T01:57:46Z | Clarification | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Initialized Jira-backed SCRUM-14 requirements artifact.
- 2026-03-14T01:57:46Z | Clarification | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Finalized scope boundaries and testable acceptance criteria for migration spike.
- 2026-03-14T01:57:46Z | Analysis | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed current SQLite runtime coupling and Postgres rehearsal constraints.
- 2026-03-14T01:57:46Z | Analysis | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Defined schema/data/parity/rollback architecture for migration spike execution.
- 2026-03-14T01:57:46Z | Implementation | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Began coding migration spike scripts, docs, and command wiring.
- 2026-03-14T02:10:24Z | Implementation | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Added schema/rehearsal/parity/benchmark tooling and Postgres migration runbook.
- 2026-03-14T02:03:18Z | Testing | Started | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Started local Docker-based migration rehearsal and parity verification.
- 2026-03-14T02:09:49Z | Testing | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Completed `test:e2e`, `test:a11y`, and `workflow:final-pass`.
- 2026-03-14T02:10:24Z | Review | Completed | model=openai/gpt-5.3-codex | tokens_in=estimate | tokens_out=estimate | token_source=estimate | Reviewed changed files and completed scoped Snyk Code scan (0 issues).

