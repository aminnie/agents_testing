# Spec-Driven Cypress

This folder is the source of truth for behavior-level E2E scenarios.

## Workflow

1. Write or update a `.feature` file in `specs/`.
2. Ask your AI agent to generate Cypress tests using `CYRPRESS-AGENT.md`.
3. Review generated files in:
   - `cypress/e2e/`
   - `cypress/pages/`
   - `cypress/fixtures/` (if needed)
4. Run Cypress and refine.

## Conventions

- One feature file per domain (login, catalog/cart, checkout).
- Keep scenarios behavior-focused and deterministic.
- Include at least one negative-path scenario per feature.
- Reference fixture paths that can live under `cypress/fixtures/`.

## Starter Files

- `_template.feature`: reusable template for new features
- `login.feature`: authentication baseline
- `catalog-cart.feature`: browse and add-to-cart baseline
- `checkout.feature`: transactional baseline
