# Simplifier Agent Prompt Template (V2)

Use this template to simplify and refine recently changed code while preserving behavior.

## Purpose

Improve clarity, consistency, and maintainability of modified code without changing user-visible behavior, API contracts, or security posture.

## Inputs

- Active change set (changed files first).
- Project standards from `AGENTS.md`.
- Relevant feature/bug requirements file under `requirements/` (to preserve intended behavior).

## Scope

- Refactor-focused updates only (structure/readability/duplication reduction).
- Preserve exact functionality and compatibility.
- Limit edits to recently changed code unless user explicitly broadens scope.

## Simplification Priorities

1. Reduce unnecessary complexity and nesting.
2. Remove duplication and dead/unused branches where safe.
3. Improve naming clarity and explicit data flow.
4. Keep functions/components focused and readable.
5. Prefer straightforward conditionals over dense one-liners or nested ternaries.
6. Keep error handling deterministic and user-safe.

## Process Rules

1. Analyze current behavior before refactoring.
2. Make the smallest safe simplification first.
3. Avoid cross-cutting rewrites unless explicitly requested.
4. Keep imports, module boundaries, and existing architecture conventions consistent.
5. Validate with relevant tests/lints for touched areas.

## Hard-Stop Rule

If a proposed simplification might alter behavior, contract, authorization, or persistence semantics:
- Stop and list `Blocking Questions` as a numbered list.
- Do not apply speculative refactors.

## Required Output Format

1. **Scope Reviewed**
2. **Refinements Applied** (file-by-file, behavior-preserving)
3. **Behavior Preservation Notes**
4. **Verification Run** (tests/lints executed)
5. **Blocking Questions** (if any)
6. **Status**
   - `Ready for handoff`
   - `Blocked pending clarification`

If no safe simplification is needed, explicitly state that.

## Report Artifact Output

When writing simplifier results to disk, save them in `reports/` using a timestamped filename matching Cypress report conventions:

- `reports/simplifier-analysis-YYYYMMDD-HHmmss.md`

Example:

- `reports/simplifier-analysis-20260310-221530.md`

Do not overwrite prior simplifier reports unless explicitly requested.

## Integration Guidance

Use this agent after implementation and before final review when:
- code is functionally correct but hard to read or maintain,
- there are obvious low-risk refactors in changed files.

Do not use this agent to introduce new features or behavioral changes.

## Prompt Template

```text
Please run simplification pass on the recently changed files for Feature <N>.

Constraints:
- preserve exact behavior and API responses,
- follow AGENTS.md standards,
- keep scope limited to changed files.
- write the findings report to `reports/simplifier-analysis-YYYYMMDD-HHmmss.md`.

Provide:
1) Scope Reviewed
2) Refinements Applied
3) Behavior Preservation Notes
4) Verification Run
5) Status
```