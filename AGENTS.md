# [AGENTS.md](http://AGENTS.md)

Project-wide guidance for human contributors and AI coding agents.

This file defines baseline engineering standards for this repository.

For a quick summary of each `AGENT-*.md` file and the recommended execution sequence, see `README.md` under `Agent Files and Workflow Order`.

## Agent Entry Points

Use these files by intent:

- `AGENTS.md` - high-level, cross-tool project standards and guardrails.
- `AGENT-ANALYSIS.md` - technical/architecture analysis workflow.
- `AGENT-CLARIFICATION.md` - requirements decision-finalization workflow.
- `AGENT-CYRPRESS.md` - Cypress generation and test-maintenance workflow.
- `AGENT-REVIEW.md` - final code review workflow and reporting format.

## Instruction Precedence (When Instructions Conflict)

Apply instructions in this order:

1. direct user instruction for the current task
2. `AGENTS.md` project-wide policy
3. specialized `AGENT-*.md` workflow files
4. README/examples/reference docs

If conflict remains after this order, stop and ask the user for a decision.

## 1) Mission

Build and maintain software that is:

- correct
- secure
- maintainable
- testable
- easy to understand

Prefer small, reversible changes over broad risky rewrites.

## 2) Working Principles

1. Prioritize user-visible correctness.
2. Optimize for clarity before cleverness.
3. Keep changes scoped to the request.
4. Preserve backward compatibility unless a breaking change is explicitly requested.
5. Leave the codebase cleaner than you found it.

## 3) Architecture and Structure

- Keep clear separation of concerns (UI, domain logic, data access, infrastructure).
- Favor modular files with single responsibilities.
- Avoid oversized files; split when files become difficult to reason about.
- Keep folder and naming conventions consistent with existing project structure.

## 4) Code Quality Standards

- Use descriptive names for functions, variables, and files.
- Avoid duplicated logic; extract reusable helpers.
- Keep functions focused and reasonably small.
- Prefer explicit data flow and predictable state transitions.
- Add comments only when explaining non-obvious intent.

## 5) Error Handling and Resilience

- Validate inputs at boundaries (API handlers, forms, commands).
- Fail fast with actionable, user-safe error messages.
- Do not swallow exceptions silently.
- Ensure UI/API failures are handled deterministically.

## 6) Security Baselines

- Never hardcode secrets or credentials in source files.
- Never commit `.env` values with real secrets.
- Avoid logging sensitive data (tokens, credentials, card numbers, PII).
- Sanitize and validate untrusted input.
- Follow least-privilege principles for integrations and runtime behavior.

### 6.1) Snyk scope control (prevent scope creep)

- Default Snyk scans must be limited to the active feature scope (changed files/directories only).
- Do not run repo-wide Snyk scans unless the user explicitly requests a repository-wide security pass.
- Remediate only vulnerabilities in files modified for the current feature.
- If scan output includes out-of-scope findings:
  - report them as out-of-scope in review/results notes,
  - do not implement unrelated fixes automatically.
- Expand remediation scope only with explicit user approval.
- Exception: if a critical and clearly exploitable issue is found outside current scope, stop and ask the user whether to widen scope immediately.

## 7) Dependency and Tooling Policy

- Use package managers to add/update dependencies.
- Do not invent dependency versions manually.
- Keep lockfiles in sync with dependency changes.
- Prefer existing project scripts over ad-hoc shell commands.

## 8) Testing Expectations

- Every meaningful behavior change should be validated with tests.
- Keep tests deterministic and independent.
- Avoid timing-based assertions and arbitrary sleeps.
- Keep critical-path tests stable and easy to debug.
- Update existing tests/specs when behavior changes.

For Cypress conventions, selectors, and generation flow, use:

- `AGENT-CYRPRESS.md`

## 9) API and Data Guidelines

- Keep API contracts explicit and predictable.
- Prefer consistent response shapes and status code semantics.
- Keep fixture and seed data realistic but minimal.
- Preserve compatibility of existing contracts unless migration is planned.

## 10) Documentation and Developer Experience

- Update docs when behavior, commands, or workflows change.
- Ensure run/test instructions remain accurate.
- Keep README and setup docs concise and copy-paste friendly.
- Record assumptions and trade-offs for non-obvious decisions.

## 11) Change Management

When implementing changes:

1. Understand existing behavior and constraints first.
2. Ask focused clarifying questions only where requirements are ambiguous.
3. Make the smallest safe change that satisfies the request.
4. Verify with build/lint/tests as appropriate for the scope.
5. Update tests/specifications/documentation impacted by the change.
6. Summarize what changed and why.
7. Update `## Phase Timeline` in the active `requirements/*.md` file with timestamped phase entries, including at minimum:
   - `Implementation | Started`
   - `Implementation | Completed`
8. Include LLM usage tracking in `## Phase Timeline` entries:
   - required: model/provider identifier used for the phase,
   - preferred: token usage (`tokens_in` / `tokens_out`) when available,
   - fallback: if exact token usage is unavailable, record `tokens_in=estimate` and `tokens_out=estimate` with a source note.

### 11.1) Implementation start gate (explicit user confirmation required)

Do not start code changes until the user explicitly approves implementation for the active requirement.

Implementation is only eligible to start after a completed technical analysis is documented in the active `requirements/*.md` file.

Required flow:

1. Complete clarification/analysis first.
2. Ensure the active requirements file contains `## Technical Analysis` with concrete architecture, risk, and verification details.
3. Mark status as `Ready for implementation approval`.
4. Ask: `Implementation is ready. Should I start coding now? (Yes/No)`.
5. Wait for explicit confirmation before editing files or running implementation commands.

Accepted implementation triggers include clear phrases such as:

- "start implementation"
- "proceed with coding"
- "apply the changes now"
- "yes, implement"

If approval is ambiguous or missing, remain in read-only clarification/analysis mode and ask for confirmation.

### 11.2) Technical analysis lock (mandatory before implementation)

No implementation commands or code edits are allowed until all of the following are true in the active `requirements/*.md` file:

1. `## Technical Analysis` exists and is populated (not a placeholder).
2. Analysis contains at minimum:
   - architecture decision and trade-offs,
   - API/data contract impact (or explicit no-change statement),
   - risk controls and verification/test plan.
3. Status is explicitly `Ready for implementation approval`.

If the user requests coding before these conditions are met, the agent must:

1. complete technical analysis first, or
2. ask for an explicit override confirming they want to bypass the analysis gate.

If an override is granted, record the override decision in the active requirements file before implementation begins.

## 12) Verification Minimums

Before considering work complete:

- code compiles/builds for touched areas
- relevant tests pass or blockers are explicitly documented
- no obvious lint/type errors are introduced
- docs are updated when workflows/behavior changed
- assumptions, limitations, and follow-ups are noted
- for final-pass workflow, if feature/bug requirements file cannot be inferred from prompt context, ask user for explicit file path before proceeding

### 12.1) Required commands before handoff

Run these scripts before final handoff (when applicable):

- `npm run test:e2e`
- `npm run test:a11y`
- `npm run workflow:final-pass`

## 13) AI Agent Behavior Contract

AI agents working in this repo should:

- follow this file for general engineering behavior
- follow `AGENT-CYRPRESS.md` for Cypress-related work
- preserve existing user changes and avoid unrelated edits
- avoid destructive operations unless explicitly requested
- prefer reproducible, script-based workflows

### 13.1) Code review routing rule

When the user asks for a code review (for example: "review this", "run review", "final review"), agents should:

1. use `AGENT-REVIEW.md` as the default review rubric,
2. present findings first in severity order,
3. prioritize correctness/security/regression risks,
4. include residual test gaps and assumptions.

