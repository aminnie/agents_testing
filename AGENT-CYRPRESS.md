# Cypress Agent Guidance (V2)

Unified guidance for AI agents generating and maintaining Cypress tests in this repository.

This file contains both policy-level standards and generation workflow instructions.

## Purpose

Use this document to keep Cypress output:

- deterministic
- stable
- readable
- maintainable
- CI-compatible
- behavior-focused

Tests should fail only when user-visible behavior breaks.

## Scope

Applies to:

- Cypress test authoring under `cypress/`
- spec-driven generation from `specs/*.feature`
- page objects, fixtures, and support commands

Browser target for this project:

- Chrome only (no cross-browser requirement at this time)

## Project Structure

```text
cypress/
  e2e/
  fixtures/
  pages/
  support/
specs/
```

Create missing folders when required.

## Required Commands

Prefer repository scripts:

```bash
npm run cypress:open
npm run cypress:run
npm run test:e2e
```

Default agent rule: when executing full E2E validation, run `npm run test:e2e` so the PDF report artifact is generated in `reports/`.

If binary is missing:

```bash
npm run cypress:install
npm run cypress:verify
```

## Core Standards (Non-Negotiable)

1. Test user-visible behavior, not implementation internals.
2. Keep tests independent; avoid ordering dependencies.
3. Never use arbitrary waits (`cy.wait(<ms>)`).
4. Use stable selectors (`data-cy` preferred).
5. Keep tests short and focused (one behavior per test).
6. Cover positive and negative paths for critical flows.

## Test Naming and Layout

- Cypress spec files must end with `.cy.ts`.
- Use behavior-oriented names (`login.cy.ts`, `catalog-cart.cy.ts`).
- Keep large features split into multiple files.

## Selector Rules

Use:

```ts
cy.get('[data-cy="checkout-submit"]')
```

Avoid:

```ts
cy.get('.btn-primary')
cy.get('#checkout')
cy.get('div > div:nth-child(2)')
```

Naming convention:

```text
data-cy="<feature>-<element>"
```

## Page Object Rules

Use page objects when:

- a page has 3+ reusable selectors
- interactions are reused across tests

Location:

```text
cypress/pages/
```

Methods should be action-oriented:

- `submitLogin`
- `fillPayment`
- `goToCheckout`

## Wait and Network Rules

- Wait for observable UI state or aliased requests.
- Alias key requests (`@login`, `@catalog`, `@checkout`).
- Stub external/unstable dependencies where useful.
- For cache-sensitive GETs, assertions may allow `200` or `304`.

## Fixture and Data Rules

- Store fixtures under `cypress/fixtures/`.
- Keep test data minimal, deterministic, and non-sensitive.
- Reuse fixtures before creating new duplicates.

## Custom Commands

- Place reusable workflows in `cypress/support/commands.ts`.
- Keep commands user-intent oriented (`loginUi`, `seedCart`).
- Avoid hiding critical assertions inside commands.

## Flaky Test Prevention

Avoid:

- animation-timing assumptions
- arbitrary sleeps
- assertions before state is stable

Prefer:

- deterministic setup
- request aliasing
- explicit readiness checks

## Spec-Driven Generation Contract

Treat `specs/*.feature` as behavior source of truth.

Accepted input forms:

- user stories
- acceptance criteria
- UI workflows
- feature files

Default spec-to-suite mapping:

```text
specs/login.feature        -> cypress/e2e/login.cy.ts
specs/catalog-cart.feature -> cypress/e2e/catalog-cart.cy.ts
specs/checkout.feature     -> cypress/e2e/checkout.cy.ts
```

If one feature contains multiple workflows, split into multiple Cypress files.

## Generation Workflow

1. Identify distinct user behaviors.
2. Convert each behavior into a separate test case.
3. Create/update page objects only where reuse is justified.
4. Use fixtures when data setup is needed.
5. Add/verify stable selectors.
6. Add network aliases/assertions for critical flows.
7. Ensure happy path and failure path coverage.

## Required Output from Agents

For each requested feature:

1. Cypress test file(s) in `cypress/e2e/`
2. page object updates in `cypress/pages/` (if needed)
3. support/command updates (if needed)
4. fixture updates (if needed)
5. selector recommendations if stable selectors are missing

## Output Format for Generated Responses

1. concise change list
2. page object file(s)
3. Cypress test file(s)
4. selector recommendations
5. fixture additions (if applicable)

Keep prose concise and actionable.

## Quality Checklist

Before completion, verify:

- selectors are stable (`data-cy` first)
- no arbitrary `cy.wait(<time>)`
- tests are independent
- tests are behavior-focused
- key flows include positive and negative coverage
- page objects are used where justified
- tests pass locally or include clear unblock steps

## CI and Runtime Guidance

- Tests must run headlessly with `npm run cypress:run`.
- Avoid assumptions about local machine state.
- Keep logs readable and actionable (clear aliases and assertion messages).
- Screenshot/video collection can be enabled for debugging failures when needed.

## Retry Guidance

Use retries sparingly as a stability tool, not a substitute for deterministic tests.

- Prefer fixing root flakiness first.
- If retries are enabled, limit to CI (`runMode`) and keep low.

## Definition of Done

A feature is complete when:

- behavior specs exist or are updated
- Cypress tests reflect intended user behavior
- stable selectors exist
- tests are maintainable and modular
- tests pass in expected local/CI workflow

## Handoff Status

End with one of:
- `Status: Ready for handoff`
- `Status: Blocked pending clarification`
