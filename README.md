# My Store + Cypress Portfolio

This repository contains a small web store application used to develop and validate agents, skills and plugin best practices in the development life cycle.

## What is included

- Backend API (`app/backend`) with SQLite seed data:
  - 20 catalog items
  - 5 login users
- React frontend (`app/frontend`) for:
  - login
  - catalog browsing
  - item detail view
  - add to cart
  - add to cart from item detail and return to catalog
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
- `POST /api/catalog` allows `manager` and `admin` users to create new catalog items (description + price), with UUID/header generated server-side.
