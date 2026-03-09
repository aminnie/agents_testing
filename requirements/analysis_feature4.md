# Feature 4 Analysis

## Original Feature Requirements

As a Product Manager, add a HELP menu option and page to the application to:

1. Show a list of users (names and passwords) from the database so users can try different logins in this demo app.
2. Show any other useful information to help users navigate the application.

## Current State Observations

- The backend already stores demo users in SQLite (`users` table with `email`, `password`, `role`) and exposes login via `POST /api/login`.
- The frontend already has app-level navigation controls in `AppHeader` and route-driven pages in `App.jsx`.
- The current UI has no dedicated help route/page and no backend endpoint for returning demo login reference data.
- Existing docs (`README.md`) already list demo users, but there is no in-app discoverability for this information.

## Architecture Decision

Implement a dedicated Help route and backend endpoint for demo guidance:

- Add a new `GET /api/help` endpoint that returns:
  - demo users (email, password, role)
  - concise navigation/use guidance for key workflows.
- Add a `Help` navigation option in `AppHeader` and a new `/help` route/page in the frontend.
- Keep help available while authenticated and unauthenticated so new users can access demo credentials before sign-in.

This aligns with existing route/component patterns and keeps help content centrally managed by the backend.

## Security and Scope Guardrails

- This feature intentionally exposes demo credentials and must remain demo-only behavior.
- Do not include internal IDs or unnecessary user data in help responses.
- Return only the minimal fields needed for login trials: `email`, `password`, `role`.
- Keep the endpoint read-only and deterministic.

## API Design

### New endpoint: `GET /api/help`

Response shape:

- `demoUsers`: array of `{ email, password, role }`
- `navigationTips`: short list of workflow hints (for example store browsing, item details, checkout, editor product management)
- `apiNotes`: optional concise API behavior reminders for demo users

Error handling:

- Return `500` with stable message if data lookup fails.

## Frontend Component Design

- `app/frontend/src/components/AppHeader.jsx`
  - Add `Help` button (`data-cy="nav-help"`).
  - Preserve existing nav structure and behavior.

- `app/frontend/src/App.jsx`
  - Add `/help` route that works with and without session.
  - Add shared navigation handler to open Help page.
  - Keep existing auth redirect behavior intact while allowing `/help` for unauthenticated users.

- `app/frontend/src/components/HelpPage.jsx` (new)
  - Fetch `GET /api/help` and render:
    - demo login table/list (email, password, role)
    - quick navigation guidance
  - Show loading/error states with clear messages.
  - Include `data-cy` hooks for stable Cypress assertions.

## Testing and Spec Plan

- Add new behavior spec: `specs/help.feature`
  - positive:
    - help page is reachable from nav
    - demo user credentials are visible
    - navigation tips are visible
  - negative:
    - backend help error state is shown gracefully

- Add Cypress coverage: `cypress/e2e/help.cy.ts`
  - assert nav access to help
  - assert `GET /api/help` returns `200`
  - assert credentials and guidance render
  - assert fallback UI for API error using intercept stubs

- Optional page object: `cypress/pages/HelpPage.ts`

## Implementation Map

### Files to Modify

- `app/backend/src/server.js`
  - Add `GET /api/help`.
  - Query users table for demo credentials and role info.

- `app/frontend/src/App.jsx`
  - Add help route integration and unauthenticated access exception.
  - Wire header help navigation callback.

- `app/frontend/src/components/AppHeader.jsx`
  - Add Help nav control.

- `README.md`
  - Add note for in-app Help page discovery.

### Files to Create

- `app/frontend/src/components/HelpPage.jsx`
- `specs/help.feature`
- `cypress/e2e/help.cy.ts`
- optional `cypress/pages/HelpPage.ts`

## Data Flow

1. User clicks `Help` in header (or navigates directly to `/help`).
2. Frontend renders `HelpPage` and requests `GET /api/help`.
3. Backend queries `users` table and returns demo help payload.
4. `HelpPage` renders demo credentials and guidance content.
5. User uses listed credentials to sign in and navigate workflows.

## Build Sequence

- [ ] Phase 1: backend help endpoint (`GET /api/help`)
- [ ] Phase 2: frontend route and Help page
- [ ] Phase 3: header navigation update
- [ ] Phase 4: behavior spec + Cypress tests
- [ ] Phase 5: regression run across login/catalog/checkout/editor/help flows

## Open Questions

1. Should Help be visible in header only after login, or always visible (recommended: always visible for demo usability)?
2. Should help endpoint include all users from DB, or only seeded demo users?

## What Changed

- Implemented `GET /api/help` in `app/backend/src/server.js` to return:
  - demo users (`email`, `password`, `role`) from DB
  - navigation tips
  - API notes
- Added frontend Help page component `app/frontend/src/components/HelpPage.jsx` with loading/error/data states.
- Integrated help routing and navigation in `app/frontend/src/App.jsx`:
  - unauthenticated access to `/help`
  - authenticated route `/help`
  - login and header navigation into help flow
- Updated `app/frontend/src/components/AppHeader.jsx` and `app/frontend/src/components/LoginScreen.jsx` with Help controls.
- Added behavior coverage for Help:
  - `specs/help.feature`
  - `cypress/e2e/help.cy.ts`
- Updated `README.md` to document in-app help behavior and `GET /api/help`.

### File-by-File Checklist

- [x] `app/backend/src/server.js`
  - Added `GET /api/help` endpoint and response payload.

- [x] `app/frontend/src/components/HelpPage.jsx`
  - Added Help UI for demo credentials + guidance + error handling.

- [x] `app/frontend/src/App.jsx`
  - Added help route wiring and unauthenticated help access support.

- [x] `app/frontend/src/components/AppHeader.jsx`
  - Added Help navigation control for authenticated users.

- [x] `app/frontend/src/components/LoginScreen.jsx`
  - Added Help navigation control for unauthenticated users.

- [x] `specs/help.feature`
  - Added Help feature behavior specification.

- [x] `cypress/e2e/help.cy.ts`
  - Added Help E2E coverage for success/error/navigation paths.

- [x] `README.md`
  - Added docs for in-app Help and help API endpoint.
