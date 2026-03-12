# Analysis Agent Prompt Template (V2)

Use this template to produce a complete technical and architectural analysis before implementation.

This analysis flow must work for both:
- `requirements/product_feature<N>.md`
- `requirements/product_bug<N>.md`

## Purpose

Deliver a decisive, implementation-ready blueprint by analyzing existing code patterns and mapping requested behavior to concrete, low-risk changes.

## Inputs

- A target requirements file under `requirements/` (feature or bug).
- Current project standards from `AGENTS.md`.
- Clarification outcomes from `## Clarification Decisions` when present.

## Scope

- Analysis only (no implementation/code edits as part of the analysis response itself).
- Make one recommended architecture approach with rationale and trade-offs.
- Keep changes compatible unless requirements explicitly call for breaking behavior.
- Implementation must not begin until this analysis is complete and explicitly approved by the user.

## Core Process

1. **Codebase Pattern Analysis**
   - Identify established backend/frontend/testing patterns to reuse.
   - Locate similar features and conventions to minimize risk.
   - Confirm constraints from `AGENTS.md` and related project guidance.

2. **Architecture Design**
   - Define the target behavior and system boundaries.
   - Specify API, UI, data, authorization, and state management impacts.
   - Identify security, resilience, and regression risks with mitigations.

3. **Implementation Blueprint**
   - Produce a file-by-file implementation map.
   - Define sequencing and dependencies across backend, frontend, tests, and docs.
   - Include verification plan and completion criteria.

## Hard-Stop Rule

If required decisions are unresolved or requirements conflict:
- Return `Blocking Questions` as a numbered list (`1.`, `2.`, `3.`...).
- State that analysis is blocked pending clarification.
- Do not invent defaults silently.

If analysis output is incomplete, inconsistent, or missing required sections:
- Do not proceed to implementation.
- Update/fix the analysis first, then request implementation approval.

## Required Output in the Requirements File

Update the same target `product_*` file with these sections:
- `## Technical Analysis`
- `## Implementation Plan`
- `## Test Strategy`
- `## What Changed` (analysis planning updates only, not implementation results)
- `## Phase Timeline` (append timestamped `Analysis` phase updates)

Each section must be explicit and actionable.

## Required Analysis Content

Include all of the following:
- **Patterns and conventions found** with file path references
- **Architecture decision** with rationale and trade-offs
- **API/data contract changes** (if any), including compatibility notes
- **UI/UX behavior changes** and role/permission visibility rules (if applicable)
- **File-by-file implementation map** with concrete edits
- **Data flow overview** from entry points to persistence/output
- **Risk controls** for error handling, security, and regressions
- **Test strategy** covering Cypress specs, fixtures/page objects, and accessibility impact
- **Verification commands** expected before handoff
- **Blocking Questions** (numbered), if unresolved

## Handoff Status

End with one of:
- `Status: Ready for implementation approval`
- `Status: Blocked pending clarification`

When status is `Ready for implementation approval`, the agent must ask:
`Implementation is ready. Should I start coding now? (Yes/No)`
and wait for explicit confirmation before any implementation edits/commands.

## Prompt Template

```text
Please proceed to analyze requirements/product_feature<N>.md.

Use AGENTS.md and existing project patterns.
Update the same requirements file with:
- ## Technical Analysis
- ## Implementation Plan
- ## Test Strategy
- ## What Changed

If unresolved decisions remain, return numbered blocking questions and stop.
```

## Bug Variant Template

```text
Please proceed to analyze requirements/product_bug<N>.md.

Use AGENTS.md and existing project patterns.
Update the same requirements file with:
- ## Technical Analysis
- ## Implementation Plan
- ## Test Strategy
- ## What Changed

If unresolved decisions remain, return numbered blocking questions and stop.
```