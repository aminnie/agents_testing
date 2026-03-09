# My Store Agents Development Application

This repository contains a small web store application used to develop and validate agents, skills and plugin best practices in the development life cycle.

## What is included

- Backend API (`app/backend`) with SQLite seed data:
  - 20 catalog items
  - 5 login users
- React frontend (`app/frontend`) for:
  - login
  - in-app help page with demo credentials and navigation guidance
  - catalog browsing
  - item detail view
  - add to cart
  - add to cart from item detail and return to catalog
  - editor product create/edit form
  - checkout with payment details
- Spec-driven artifacts:
  - `specs/*.feature`
  - Cypress page objects and tests under `cypress/`

## Prerequisites

- Node.js 20+ recommended
- npm 10+

## Install

```bash
npm install
```

## Optional port overrides

Default ports:

- backend: `4000`
- frontend: `5173`

You can override them for any command:

```bash
BACKEND_PORT=4100 FRONTEND_PORT=5180 npm run dev
```

The same overrides work for:

- `npm run dev:clean`
- `npm run dev:backend`
- `npm run dev:backend:clean`
- `npm run dev:frontend`
- `npm run dev:frontend:clean`
- `npm run cypress:open`
- `npm run cypress:run`
- `npm run test:e2e`

You can copy `.env.example` for reference, but these scripts read shell environment variables directly.

## Run the application

Run backend and frontend together:

```bash
npm run dev
```

If either port is already in use (`4000` or `5173`), use:

```bash
npm run dev:clean
```

Frontend: [http://localhost:5173](http://localhost:5173)  
Backend health: [http://localhost:4000/health](http://localhost:4000/health)

## Run Cypress tests

Headless:

```bash
npm run test:e2e
```

Interactive:

```bash
npm run cypress:open
```

Headless (Cypress only, assumes app is already running):

```bash
npm run cypress:run
```

Run specific specs (argument forwarding supported):

```bash
npm run cypress:run -- --spec cypress/e2e/checkout.cy.ts
```

If Cypress reports that no binary is installed, run:

```bash
npm run cypress:install
npm run cypress:verify
```

## Local manual E2E sequence

Use this flow if the combined `npm run test:e2e` command is not reliable in your environment.

Terminal 1 (backend):

```bash
npm run dev:backend
```

If port `4000` is already in use, use:

```bash
npm run dev:backend:clean
```

Terminal 2 (frontend):

```bash
npm run dev:frontend
```

If port `5173` is already in use, use:

```bash
npm run dev:frontend:clean
```

Terminal 3 (tests):

```bash
npm run cypress:open
```

or headless:

```bash
npm run cypress:run
```

Expected local URLs (with default ports):

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/health`

## Demo users

- `user@example.com` / `CorrectHorseBatteryStaple1!`
- `shopper@example.com` / `Password123!`
- `manager@example.com` / `Password123!`
- `editor@example.com` / `Password123!`
- `admin@example.com` / `Password123!`

Role types are normalized in the backend as:

- `1 = admin`
- `2 = manager`
- `3 = user`
- `4 = editor`

## Key folders

- `app/backend/src` - API and SQLite bootstrap
- `app/backend/data` - SQLite database storage location
- `app/frontend/src` - React UI
- `cypress/e2e` - Cypress suites
- `cypress/pages` - page objects
- `cypress/support` - commands/support hooks
- `specs` - feature specs used for generation

## API notes

- `GET /api/catalog` returns catalog items with UUID ids, generated headers, descriptions, and prices.
- `GET /api/catalog/:id` returns item detail for a UUID id.
- `GET /api/help` returns demo user credentials and navigation guidance for this demo app.
- `POST /api/catalog` allows `editor` and `manager` users to create new catalog items (header/description + price), with UUID generated server-side.
- `PUT /api/catalog/:id` allows `editor` and `manager` users to update catalog item header, description, and price.
- `POST /api/login` returns `user.role` (normalized role name) and `user.roleId` (numeric role type id).

## Agent Prompt Templates

Use these prompts to drive the standard feature workflow.

Feature analysis prompt:

```text
Please proceed to analyze requirements/analysis_feature<N>.md
```

Example:

```text
Please proceed to analyze requirements/analysis_feature4.md
```

Feature implementation prompt:

```text
Please proceed to implement Feature <N>
```

Example:

```text
Please proceed to implement Feature 4
```

Requirements clarification / decision finalization prompt:

```text
Please update requirements/analysis_feature<N>.md with the following decisions:

For the Open Questions:
1. <decision 1>
2. <decision 2>
3. <decision 3>

Please convert these decisions into explicit requirements and update the What Changed section.
```

Example:

```text
Please update requirements/analysis_feature4.md with the following decisions:

For the Open Questions:
1. Also allow manual header override.
2. Make create/edit available on both pages.
3. For non-editor users, disable the control and add a tooltip.

Please convert these decisions into explicit requirements and update the What Changed section.
```

Template file:

- `CLARIFICATION-AGENT.md`

End-to-end workflow example:

```text
Please proceed to analyze requirements/analysis_feature4.md
Please update requirements/analysis_feature4.md with the following decisions:
For the Open Questions:
1. <decision 1>
2. <decision 2>
Please proceed to implement Feature 4
```

## Agent Files and Sequence

Use these `*-AGENT.md` files for different stages of feature delivery:

- `CLARIFICATION-AGENT.md`
  - Use after analysis when open questions need decisions finalized.
  - Output should convert decisions into explicit requirements and update the analysis doc.
  - Example prompt:
    ```text
    Please update requirements/analysis_feature5.md with the following decisions:

    For the Open Questions:
    1. Keep manager/admin access.
    2. Add tooltip text for disabled controls.

    Please convert these decisions into explicit requirements and update the What Changed section.
    ```

- `ANALYSIS-AGENT.md`
  - Use when you want a full architecture analysis before coding.
  - Output should define design decisions, file map, test plan, and `What Changed` updates.
  - Example prompt:
    ```text
    Please proceed to analyze requirements/analysis_feature5.md
    ```

    Notes on what to typically expect of the analysis run:
    - current-state gap analysis vs requested behavior
    - finalized architecture decision
    - explicit UI visibility rules by role
    - explicit backend authorization target (manager|editor only for create/edit)
    - detailed file-by-file implementation map
    - data flow, phased build sequence, and critical details
    - updated What Changed reflecting the full analysis pass

- `CYRPRESS-AGENT.md`
  - Use when generating or refining Cypress artifacts from feature behavior.
  - Output should include/adjust specs, page objects, and E2E tests aligned with project rules.
  - Example prompt:
    ```text
    Please use CYRPRESS-AGENT.md guidance to generate Cypress coverage for Feature 5 from specs/feature5.feature
    ```

Recommended sequence once a new feature requirement is written:

1. Run analysis against `requirements/analysis_feature<N>.md` (architecture + plan).
   - Example:
     ```text
     Please proceed to analyze requirements/analysis_feature5.md
     ```
2. Run clarification to resolve open questions and finalize decisions.
   - Example:
     ```text
     Please update requirements/analysis_feature5.md with the following decisions:
     1. Add editor create access.
     2. Keep manager/admin create access.
     ```
3. Implement Feature `<N>` in code.
   - Example:
     ```text
     Please proceed to implement Feature 5
     ```
4. Use Cypress agent guidance to add/update E2E coverage as needed.
   - Example:
     ```text
     Please add/update Cypress tests for Feature 5 using CYRPRESS-AGENT.md guidance
     ```
5. Run verification (`npm run test:e2e`) and ensure the analysis file has an updated `What Changed` section.
   - Example commands:
     ```bash
     npm run test:e2e
     npm run cypress:run -- --spec cypress/e2e/feature5.cy.ts
     ```
