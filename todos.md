# Agent Guidelines Comparison Notes

## Source Compared

Pasted source: `Agent Guidelines for incident-escalation`

Compared against current project agent docs:

- `AGENTS.md`
- `ANALYSIS-AGENT.md`
- `CLARIFICATION-AGENT.md`
- `CYRPRESS-AGENT.md`
- `SIMPLIFIER-AGENT.md`
- `REVIEW-AGENT.md`

## 1) Comparison Summary

Current project agent files are strong on:

- workflow sequencing and handoff gates
- requirements/analysis/review structure
- Cypress quality standards
- security/testing baselines at a policy level

Pasted source is stronger on:

- specific stack/tooling mandates
- strict style conventions
- backend/API implementation conventions
- environment/runtime standards

## 2) Entries Present in Pasted Source but Not Included in Current Agent Files

### Build/lint/test command specifics

- `yarn` command set (`yarn install`, `yarn lint`, `yarn test:unit`, `yarn test:int`, `yarn test:ci`, targeted `testNamePattern`, file-scoped test run)
- dev/docs commands like `yarn docs`, client `yarn build`, `yarn preview`

### Strict formatting/style rules

- mandatory 2-space indentation
- Unix line endings
- no trailing whitespace
- single quotes + semicolons as explicit global standard
- import grouping + alphabetical sort requirements
- relative-path requirement for internal imports

### Naming/file conventions (detailed)

- kebab-case filename requirement
- service filename patterns (`serviceName.js`, `serviceName.service.js`)
- explicit casing rules repeated across backend/frontend style policy

### Client code conventions (React-specific)

- "Import React at top of all JSX files" requirement
- component folder conventions by type (`components`, `hooks`, `core`, `contexts`) as mandatory architecture mapping

### Types/docs coding conventions

- mandatory JSDoc for function signatures/params
- "Export all modules explicitly"
- "Prefer function declarations over arrow functions for methods in classes"

### Error handling implementation details

- required custom error classes (`AuthenticationError`, `ServiceError`, `DAOError`)
- structured logging requirement with `bunyan`
- explicit HTTP status mapping rule (`400` client, `500` server) as a hard standard

### Testing mandates beyond current policy

- "Write unit tests for all services/controllers"
- "Ensure 100% coverage for new functionality"
- unit-testing framework requirement for React components (RTL or similar)
- prescribed test naming phrase format (`should ... when ...`)

### API/OpenAPI structure mandates

- OpenAPI file location and domain-folder/version-folder architecture conventions
- required OpenAPI fields mapping (`x-swagger-router-controller`, `operationId` controller/function mapping)

### Security/environment specifics not currently codified

- "Use encrypted communication where possible"
- "Validate all inputs with OpenAPI schema validation" (tool-specific validation mechanism)
- mandatory `NODE_ENV` values (`development/production/staging`)
- explicit `dotenv` usage requirement
- mandatory key-management system for secrets

### Architecture/tooling mandates not present

- "Always use Postgres"
- "Always use Docker for containerization"
- fixed frontend/backend technology mandates as hard requirements (React+Vite, NodeJS, OpenAPI validation)
