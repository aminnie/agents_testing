# [AGENTS.md](http://AGENTS.md)

Project-wide guidance for human contributors and AI coding agents.

This file defines baseline engineering standards for this repository.

## Agent Entry Points

Use these files by intent:

- `AGENTS.md` - high-level, cross-tool project standards and guardrails.
- `ANALYSIS-AGENT.md` - technical/architecture analysis workflow.
- `CLARIFICATION-AGENT.md` - requirements decision-finalization workflow.
- `CYRPRESS-AGENT.md` - Cypress generation and test-maintenance workflow.
- `REVIEW-AGENT.md` - final code review workflow and reporting format.

## Instruction Precedence (When Instructions Conflict)

Apply instructions in this order:

1. direct user instruction for the current task
2. `AGENTS.md` project-wide policy
3. specialized `*-AGENT.md` workflow files
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

- `CYRPRESS-AGENT.md`

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

### 11.1) When explicit approval is required before implementation

Ask for explicit approval before proceeding when work includes:

- breaking API or schema changes
- data migrations or destructive data operations
- authentication/authorization/security-sensitive behavior changes
- large refactors across many files/modules
- deleting files or removing major functionality

For routine, low-risk changes (small bug fixes, copy updates, minor styling, non-breaking test updates), proceed directly.

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
- follow `CYRPRESS-AGENT.md` for Cypress-related work
- preserve existing user changes and avoid unrelated edits
- avoid destructive operations unless explicitly requested
- prefer reproducible, script-based workflows

### 13.1) Code review routing rule

When the user asks for a code review (for example: "review this", "run review", "final review"), agents should:

1. use `REVIEW-AGENT.md` as the default review rubric,
2. present findings first in severity order,
3. prioritize correctness/security/regression risks,
4. include residual test gaps and assumptions.

