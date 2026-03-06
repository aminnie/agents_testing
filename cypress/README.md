# Cypress Test Workspace

This folder contains generated and hand-written Cypress assets.

## Layout

```text
cypress/
  e2e/       # Cypress test specs (*.cy.ts)
  fixtures/  # deterministic data for tests
  pages/     # page object classes
  support/   # shared support commands and setup
```

## Spec-Driven Flow

1. Author behavior in `specs/*.feature`.
2. Generate tests with `CYRPRESS-AGENT.md`.
3. Save generated tests under `cypress/e2e/`.
4. Keep reusable interaction code in `cypress/pages/`.
