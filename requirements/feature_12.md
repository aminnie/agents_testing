As the Store Product Owner, I would like to add a Item Search feature to the catalog listing in order to reduce the number of items to be paged through.

1. Add a search input text box in the item listing heading.
2. Use the text entered in the search (max 20 characters) to search the catalog store and return only matching items in the listing.
3. Provide a clear search option that would restore the full list of items
4. The search list functionality continues to behave as it does currently.
5. Validate the content of the search input box to prevent SQL injection and other security risks.

## Clarification Decisions

### Decisions Applied

1. Matching strategy: use `contains`.
2. Searchable fields: `name`, `header`, and `description`.
3. Search trigger: run only on explicit submit (`Search` action).
4. Pagination behavior: when search is active, reset to page 1.
5. URL behavior: reflect search state in URL query parameters.
6. Zero-result UX: show a `No results` message.
7. Input validation: allow printable characters only.

### Requirements Updates

1. Add a search input in the catalog listing header area with a maximum length of 20 characters.
2. On explicit `Search` action, filter catalog results using case-insensitive `contains` matching across `name`, `header`, and `description`.
3. While a search filter is active, reset pagination to page 1 and paginate only the filtered result set.
4. Persist search state in URL query parameters so deep linking and browser navigation preserve search context.
5. Provide a clear-search action that removes the filter, restores the full catalog list, and preserves normal pagination behavior.
6. For zero matches, display a visible `No results` message in the listing area.
7. Validate search input to allow printable characters only, and continue using safe backend query handling.

### Acceptance Criteria Updates

1. Catalog page renders a search input and explicit `Search` and clear-search controls in the listing header area.
2. Submitting `vibe` returns only items where `name`, `header`, or `description` contains `vibe` (case-insensitive).
3. Search input does not accept more than 20 characters.
4. Activating search always sets current page to 1 and keeps pagination scoped to filtered items.
5. URL includes search query state while filter is active, and reloading/back-forward preserves the filtered view.
6. When no items match, a `No results` message is shown and no catalog rows are rendered.
7. Clear-search removes search URL state, restores full catalog results, and returns normal list behavior.
8. Non-printable input is rejected/handled safely and does not cause backend errors or unsafe query execution.

### Blocking Questions

1. None.

### Status

Ready for analysis

## Technical Analysis

### Current State Observations

1. Catalog data is fetched once from `GET /api/catalog` in `app/frontend/src/App.jsx`, then paginated client-side via URL params (`page`, `pageSize`).
2. Catalog pagination state is already URL-backed in `app/frontend/src/App.jsx` and validated by `cypress/e2e/catalog-pagination.cy.ts`.
3. Catalog UI heading and pagination controls are rendered in `app/frontend/src/components/StorePage.jsx`, which is the right integration point for search input/actions.
4. Backend catalog list API in `app/backend/src/server.js` currently returns all items without filtering.
5. Existing API layer already uses parameterized SQLite queries, which is the correct base for injection-safe search filtering.

### Architecture Decision

Implement search as an explicit-submit filter backed by the existing `GET /api/catalog` endpoint using a query parameter, while preserving current pagination behavior:

1. Add optional query param `q` to `GET /api/catalog`.
2. Apply backend filtering using case-insensitive `contains` matching across `name`, `header`, and `description`.
3. Enforce server-side input rules (`max 20`, printable characters only) and reject invalid values with deterministic `400` responses.
4. Keep pagination client-side, but apply it to the filtered result set and reset page to `1` whenever a new search is submitted.
5. Persist active search state in URL query params to support deep linking and back/forward behavior.

This approach minimizes risk by reusing current list/pagination design while meeting security and UX requirements.

### API/Data Contract Changes

1. `GET /api/catalog` gains optional query param:
   - `q` (string, optional, max 20, printable characters only).
2. Behavior:
   - no `q` -> return full catalog list (current behavior),
   - valid `q` -> return filtered catalog list,
   - invalid `q` -> `400` with deterministic validation message.
3. Response shape remains unchanged:
   - `{ items: [...] }`.

### Security and Validation Model

1. Server validates query length and printable-character rule before query execution.
2. Server query uses bound parameters (no string concatenation) for `LIKE` search terms.
3. Frontend constrains input to 20 characters and blocks submission for non-printable values with user-safe feedback.
4. Validation is enforced on both client and server boundaries.

## Implementation Plan

### Files to Modify

1. `app/backend/src/server.js`
   - Extend `GET /api/catalog` to accept and validate `q`.
   - Add safe `LIKE` filtering over `lower(name)`, `lower(header)`, and `lower(description)`.
   - Return `400` for invalid query input.
2. `app/frontend/src/App.jsx`
   - Add URL-backed search param handling (for example `q=<term>`).
   - Add submitted-search state separate from typed input.
   - Trigger catalog fetch when submitted search changes.
   - On search submit, reset pagination to page `1` and preserve `pageSize`.
   - On clear-search, remove `q`, reset page to `1`, and fetch full list.
3. `app/frontend/src/components/StorePage.jsx`
   - Add search input, `Search` button, and clear-search control in catalog heading.
   - Add deterministic empty-state message (`No results`) when filtered set is empty.
   - Add stable `data-cy` hooks for search controls/message.
4. `cypress/pages/CatalogPage.ts`
   - Add reusable helpers for typing search text, submitting search, clearing search, and asserting no-results state.
5. `cypress/e2e/catalog-pagination.cy.ts`
   - Update/extend assertions where needed so pagination expectations remain deterministic when `q` is present in URL.
6. `cypress/e2e/accessibility.cy.ts`
   - Extend store-page accessibility coverage to include search controls and no-results state.
7. `specs/catalog-pagination.feature`
   - Add search + pagination interaction scenarios or create dedicated search spec.
8. `README.md`
   - Document catalog search behavior, URL parameter usage, and validation notes.
9. `requirements/feature_12.md`
   - Update `## What Changed` and `## Verification Results` after implementation.

### Files to Create

1. `cypress/e2e/catalog-search.cy.ts`
2. `specs/catalog-search.feature`

### Build Sequence (Implementation Checklist)

1. Backend search filter + validation in `GET /api/catalog`.
2. Frontend search state, URL sync, and page-reset integration.
3. Store UI search controls + no-results message.
4. Cypress page object updates + new catalog search spec/tests.
5. Accessibility coverage update for search/no-results states.
6. Documentation + requirements `## What Changed` / `## Verification Results`.
7. Final verification via `npm run workflow:final-pass` and review via `AGENT-REVIEW.md`.

## Test Strategy

### Functional Coverage

1. Positive search:
   - searching `vibe` returns only matching items (case-insensitive contains).
2. Multi-field coverage:
   - matches found via `name`, `header`, and `description`.
3. Explicit submit behavior:
   - typing alone does not filter until `Search` action is triggered.
4. Pagination interaction:
   - search submit resets to page `1`,
   - filtered results paginate correctly.
5. URL state:
   - `q` appears in URL when active,
   - refresh/back/forward restores search context.
6. Clear behavior:
   - clear-search removes `q`, restores full list, and normal pagination behavior.
7. Empty state:
   - zero-match query shows `No results`.

### Negative/Security Coverage

1. Input longer than 20 is blocked/rejected deterministically.
2. Non-printable characters are rejected/handled safely.
3. Backend invalid query returns deterministic `400` without exposing internals.
4. Search input resembling injection payload does not alter query semantics or break endpoint behavior.

### Accessibility Coverage

1. Search controls are keyboard reachable and labeled.
2. Store page WCAG checks remain clean with:
   - default state,
   - active search state,
   - no-results state.

## What Changed

- Backend/API updates shipped:
  - Updated `GET /api/catalog` in `app/backend/src/server.js` to support optional `q` filtering.
  - Added case-insensitive `contains` search across `name`, `header`, and `description`.
  - Added deterministic validation on `q`:
    - max 20 characters,
    - printable characters only,
    - invalid input returns `400` with user-safe messages.
  - Kept response contract unchanged (`{ items: [...] }`).
- Frontend/UI behavior that changed:
  - Added catalog search controls in `app/frontend/src/components/StorePage.jsx`:
    - search input,
    - explicit `Search` action,
    - `Clear` action,
    - deterministic `No results` message.
  - Added URL-backed search handling in `app/frontend/src/App.jsx` using `q` query param.
  - Search submit now resets pagination to page `1` while preserving page-size behavior.
  - Clear-search removes active `q` state and restores full catalog list behavior.
  - Added deterministic catalog/search error messaging for invalid query responses.
- Test/spec coverage added or modified:
  - Added new Cypress E2E suite `cypress/e2e/catalog-search.cy.ts` for:
    - explicit submit behavior,
    - URL state persistence,
    - page-reset behavior,
    - clear-search behavior,
    - max-length enforcement.
  - Added page-object helpers in `cypress/pages/CatalogPage.ts` for search interactions.
  - Added behavior spec `specs/catalog-search.feature`.
  - Updated accessibility automation in `cypress/e2e/accessibility.cy.ts` to audit store no-results search state.
  - Updated `specs/accessibility.feature` with store no-results accessibility scenario.
- Docs updates:
  - Updated `README.md` with catalog-search feature summary and `GET /api/catalog?q=...` API notes.

## Verification Results

- `BACKEND_PORT=4100 FRONTEND_PORT=5180 npm run test:e2e`
  - Result: pass (38 tests passing; PDF generated at `reports/cypress-report-20260310-145037.pdf`).
- `BACKEND_PORT=4100 FRONTEND_PORT=5180 npm run test:a11y`
  - Result: pass (5 tests passing in `cypress/e2e/accessibility.cy.ts`).
- Targeted catalog-search validation:
  - `BACKEND_PORT=4100 FRONTEND_PORT=5180 npx start-server-and-test "npm run dev:backend" "http://localhost:4100/health" "npm run dev:frontend" "http://localhost:5180" "npm run cypress:run -- --spec cypress/e2e/catalog-search.cy.ts"`
  - Result: pass (4 tests passing).

## Review Results

- Review scope: backend search API, frontend search/pagination URL integration, new Cypress/spec/a11y updates, and docs/requirements updates.
- Findings summary:
  - `Critical`: 0
  - `High`: 0
  - `Medium`: 0
  - `Low`: 0
- Security scan:
  - Snyk Code (`snyk_code_scan`) on `/Users/anton.minnie/agents_testing`: `issueCount: 0`.
- Final status: Ready for handoff.

## Phase Timeline

- 2026-03-11T14:55:20Z | Timeline | Initialized (backfilled to support phase tracking across clarification, analysis, implementation, testing, and review).
