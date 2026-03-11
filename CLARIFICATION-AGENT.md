# Clarification Agent Prompt Template (V2)

Use this template to finalize requirement decisions into an implementation-ready, testable requirements artifact.

This clarification flow must work for both:
- `requirements/product_feature<N>.md`
- `requirements/product_bug<N>.md`

## Purpose

Convert ambiguous requests and open decisions into explicit requirements and acceptance criteria that can be implemented and verified without guesswork.

## Inputs

- A target requirements file under `requirements/` (feature or bug).
- Any unresolved decisions/open questions from discovery or analysis.
- Project standards from `AGENTS.md`.

## Scope

- Clarification only (no production code implementation in this step).
- Refine the same requirements file in place.
- Preserve original request context while rewriting/expanding unclear parts.

## Core Process

1. **Review Original Requirement Text**
   - Identify ambiguity, contradictions, and missing constraints.
   - Confirm actor/route/role/validation expectations where relevant.

2. **Resolve Decisions Explicitly**
   - Convert each decision into concrete requirement language.
   - Prefer deterministic and mutually exclusive behavior statements.
   - Include negative-path rules (what must not happen).

3. **Rewrite for Testability**
   - Update acceptance criteria so outcomes are observable in UI/API tests.
   - Ensure criteria can map directly to Cypress scenarios and assertions.

## Hard-Stop Rule

If key decisions are still missing or conflicting:
- Return `Blocking Questions` as a numbered list (`1.`, `2.`, `3.`...).
- State that clarification is blocked pending decisions.
- Do not silently invent defaults.

## Required Output in the Requirements File

Ensure the target `product_*` file includes:
- `## Clarification Decisions`
  - `### Decisions Applied`
  - `### Requirements Updates`
  - `### Acceptance Criteria Updates`
  - `### Blocking Questions`
  - `### Status`

Later, after implementation is complete, the same file must include:
- `## What Changed`
- `## Verification Results`
- `## Review Results`

## Quality Checklist

- Preserve original request text at the top of the document.
- Rewrite/expand requirements; do not only append decision bullets.
- Use concrete, implementation-neutral behavior statements.
- Keep acceptance criteria objective and automation-friendly.
- Align language with patterns already used in `requirements/product_feature*.md`.

## Handoff Status

End with one of:
- `Status: Ready for analysis`
- `Status: Blocked pending clarification`

## Prompt Template

```text
Please proceed to clarify requirements/product_feature<N>.md.

Use AGENTS.md and convert all open decisions into explicit requirements.
Update the same requirements file with:
- ## Clarification Decisions
  - ### Decisions Applied
  - ### Requirements Updates
  - ### Acceptance Criteria Updates
  - ### Blocking Questions
  - ### Status

Important:
- preserve the original request context,
- rewrite and expand ambiguous requirement text,
- make acceptance criteria directly testable.

If unresolved decisions remain, return numbered blocking questions and stop.
```

## Bug Variant Template

```text
Please proceed to clarify requirements/product_bug<N>.md.

Use AGENTS.md and convert all open decisions into explicit requirements.
Update the same requirements file with:
- ## Clarification Decisions
  - ### Decisions Applied
  - ### Requirements Updates
  - ### Acceptance Criteria Updates
  - ### Blocking Questions
  - ### Status

Important:
- preserve the original request context,
- rewrite and expand ambiguous requirement text,
- make acceptance criteria directly testable.

If unresolved decisions remain, return numbered blocking questions and stop.
```
