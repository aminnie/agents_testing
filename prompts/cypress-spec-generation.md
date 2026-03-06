# Cypress Spec Generation Prompt

You generate Cypress tests from `.feature` specs in `/specs`.

## Inputs

- feature spec file(s) from `/specs`
- existing Cypress setup in `/cypress`
- project testing rules from `CYRPRESS-AGENT.md`

## Required Outputs

1. one Cypress spec per feature under `cypress/e2e/`
2. page objects under `cypress/pages/` only when needed
3. helper updates under `cypress/support/` only when needed
4. fixture files under `cypress/fixtures/` when referenced by tests

## Non-Negotiable Rules

- use `data-cy` selectors first
- use `cy.intercept()` for critical network assertions
- do not use arbitrary `cy.wait(<ms>)`
- keep tests independent and idempotent
- include happy path and negative path coverage
- split large features into multiple spec files

## Naming Conventions

- `describe('Feature: <FeatureName>')`
- `it('<behavior statement>')`
- request aliases like `@login` and `@createOrder`
- action-oriented page object methods (for example `submitLogin`)

## Assertion Standards

- assert URL or route transitions
- assert visible success or error messages
- assert key network response status codes
- assert no unintended side effects for invalid flows

## Output Format

1. concise change list
2. full file contents for each created or updated file
3. selector recommendations for missing attributes
