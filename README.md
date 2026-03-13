# Happy Vibes Store Agents Development Application

This repository contains a small web store application that is used to develop and validate AI agents, skills and plugin best practices in the development life cycle. The agents provided guides the development process to ensure a consistent process is followed from requirements review through a fully tested and code reviewed application.

## AI Agent Files and Workflow Order

This project includes the following agent guidance files used to drive the development process:

- `AGENTS.md` - default baseline engineering policy and instruction precedence for all work in this repository.
- `AGENT-CLARIFICATION.md` - refines ambiguous requirement or bug requests into explicit, testable requirements and acceptance criteria before build work starts.
- `AGENT-ANALYSIS.md` - produces technical analysis, architecture decisions, implementation map, and risk/test strategy for a selected requirement file.
- `AGENT-CYRPRESS.md` - defines Cypress generation/maintenance standards, selector rules, and spec-driven test workflow for `specs/*.feature`.
- `AGENT-SIMPLIFIER.md` - runs behavior-preserving refactor/simplification passes on changed code to improve readability and maintainability (optional manual step).
- `AGENT-REVIEW.md` - performs final review with findings-first reporting focused on correctness, regression risk, and security.

Recommended workflow order:

1. `AGENTS.md` - start with default project standards and instruction precedence.
2. `AGENT-CLARIFICATION.md` - finalize requirement details and decisions.
3. `AGENT-ANALYSIS.md` - create implementation-ready technical blueprint.
4. Implement code changes (following `AGENTS.md` baseline rules) only after the active `requirements/*.md` includes a completed `## Technical Analysis`, status is `Ready for implementation approval`, and the user explicitly confirms implementation.
5. `AGENT-CYRPRESS.md` - generate/update Cypress/spec and code artifacts and validate behavior.
6. `AGENT-SIMPLIFIER.md` (optional manual step) - manually invoke when you want a behavior-preserving simplification pass before final review.
7. `AGENT-REVIEW.md` - run final pass review before handoff/PR.

### Code Implementation Trigger Summary

When code implementation is triggered (step 4 in the workflow), the agent should:

1. Use the clarified requirements and technical analysis as the implementation source of truth.
2. Confirm the analysis lock is satisfied before coding:
  - `## Technical Analysis` is complete in the active `requirements/*.md`,
  - status is `Ready for implementation approval`,
  - user has explicitly approved implementation in the current thread.
3. Apply scoped backend/frontend/test/documentation changes required to satisfy the target `requirements/feature_*.md` or `requirements/bug_*.md` file.
4. Preserve baseline guardrails from `AGENTS.md` (small safe changes, no destructive operations, no unrelated edits).
5. Update Cypress/spec artifacts as needed (following `AGENT-CYRPRESS.md`) so behavior is validated and regression-safe.
6. Run verification commands before handoff:
  - `npm run test:e2e (spec driven smoke and regression tests)`
  - `npm run test:a11y (accessibility testing portfolio)`
  - `npm run workflow:final-pass`
7. Run a Snyk code scan on changed first-party code; when Snyk is installed/configured as an MCP in the IDE, this scan is automatically triggered as part of the implementation flow (using `snyk_code_scan` on the affected frontend/backend source path). Resolve any new findings before handoff.
8. Update the requirements artifact with delivered outcomes:
  - `## What Changed`
  - `## Verification Results`
  - `## Review Results`

Note:

- Code review is part of the recommended workflow (`AGENT-REVIEW.md`), but it is not implicitly auto-triggered by code edits unless your orchestration explicitly invokes it (or the user requests a review).
- `AGENT-SIMPLIFIER.md` is an optional manual step and runs only when explicitly invoked (it is not auto-triggered).

### Phase Timeline Entry Format

For each `requirements/*.md` file, maintain a `## Phase Timeline` section and append entries as work progresses.

When creating a new requirements artifact, start from:

- `requirements/template.md`

Recommended entry format:

- `<UTC_ISO_TIMESTAMP> | <Phase> | <State> | <Optional note>`

LLM tracking fields (append to each timeline entry):

- required: `model=<provider/model-or-session-id>`
- preferred: `tokens_in=<n> | tokens_out=<n>`
- fallback when exact usage is unavailable: `tokens_in=estimate | tokens_out=estimate | token_source=estimate`

Example:

- `2026-03-11T15:02:10Z | Clarification | Started | Open questions identified`
- `2026-03-11T15:10:44Z | Clarification | Completed | Requirements and acceptance criteria updated`
- `2026-03-11T15:12:00Z | Analysis | Started`
- `2026-03-11T15:28:31Z | Analysis | Completed | Implementation plan and test strategy documented`
- `2026-03-11T15:29:10Z | Implementation | Started`
- `2026-03-11T16:02:45Z | Testing | Completed | test:e2e and test:a11y passing`
- `2026-03-11T16:10:22Z | Review | Completed | Ready for handoff`
- `2026-03-11T16:11:00Z | Review | Completed | model=openai/gpt-5.3 | tokens_in=estimate | tokens_out=estimate | token_source=estimate`

Suggested states:

- `Started`
- `Completed`
- `Blocked`
- `Resumed`

Implementation enforcement:

- During implementation, update the active `requirements/*.md` timeline with timestamped entries for:
  - `Implementation | Started`
  - `Implementation | Completed`
- This is enforced as a default change-management requirement in `AGENTS.md`.

See below for more details on the agents and how to invoke from a Chat Agent.

## Role of `workflow:final-pass`

The `workflow:final-pass` script is the final workflow gate before handoff/PR. It verifies both runtime quality and delivery artifact completeness.

What it does:

1. Resolves the target requirements review file:
  - uses `REQUIREMENTS_REVIEW_PATH` when provided,
  - otherwise attempts prompt-based inference (direct `requirements/...md` path, `feature <N>`, or `bug <N>`).
2. Runs `npm run test:e2e`.
3. Runs `npm run test:a11y`.
4. Validates that the requirements review file exists, is non-empty, and contains:
  - `## What Changed`
  - `## Verification Results`
  - `## Review Results`
5. Fails fast with actionable guidance if any step is missing or failing.

Why it matters:

- prevents incomplete handoff by enforcing core regression and accessibility checks,
- ensures the requirements artifact documents what shipped and how it was validated.

Next Up:

- Explore agent skills and plug-ins to provide more advanced guidance and capabilities (e.g. Jira integration).

## Jira-Backed Clarification Flow

This repo includes a Jira-oriented clarification workflow for tickets like `SCRUM-1`.

### 1) Configure environment variables

Set:

- `JIRA_BASE_URL` (example: `https://your-org.atlassian.net`)
- `JIRA_EMAIL` (Atlassian account email)
- `JIRA_API_TOKEN` (Atlassian API token)

### 2) Optional local Jira MCP server setup

Workspace MCP config is provided in `.cursor/mcp.json` with server id `jira`.
It uses:

- package: `@mcp-devtools/jira`
- env names expected by server:
  - `JIRA_URL` (mapped from `JIRA_BASE_URL`)
  - `JIRA_API_MAIL` (mapped from `JIRA_EMAIL`)
  - `JIRA_API_KEY` (mapped from `JIRA_API_TOKEN`)

### 3) Create requirements file from Jira

```bash
npm run jira:read -- --issue SCRUM-1
npm run jira:req:init -- --issue SCRUM-1
```

Generated output:

- `requirements/feature_SCRUM-1.md` (default)
- `requirements/bug_SCRUM-1.md` with `--type bug`
- The generated file is also persisted as the active requirements pointer in `requirements/.state/active-requirements.txt`.

### 4) Run clarification

Use `AGENT-CLARIFICATION.md` to update the generated requirements file:

- `## Clarification Decisions`
- `### Decisions Applied`
- `### Requirements Updates`
- `### Acceptance Criteria Updates`
- `### Blocking Questions`
- `### Status`

### 5) Optional: sync approved requirements back to Jira description

This step is optional and not required for clarification completion.

If you want to update the Jira ticket description anyway, run dry-run first:

```bash
npm run jira:update-description -- --issue SCRUM-1 --requirements requirements/feature_SCRUM-1.md --approved yes --dry-run
```

Then real update:

```bash
npm run jira:update-description -- --issue SCRUM-1 --requirements requirements/feature_SCRUM-1.md --approved yes --dry-run false
```

### 6) Optional final-pass publish (attachment + completion comment)

You can publish the active requirements artifact to Jira at the end of `workflow:final-pass`.

Set:

- `JIRA_ISSUE_KEY=SCRUM-1`
- `JIRA_FINAL_PASS_PUBLISH=true`
- `JIRA_FINAL_PASS_APPROVED=no` (default dry-run safety)

Run:

```bash
npm run workflow:final-pass
```

Behavior:

- If `JIRA_FINAL_PASS_PUBLISH=true` and `JIRA_ISSUE_KEY` is set, final pass calls:
  - `npm run jira:publish-final -- --issue <KEY> --requirements <active requirements file>`
- With `JIRA_FINAL_PASS_APPROVED=no`, Jira publish runs in dry-run mode.
- Set `JIRA_FINAL_PASS_APPROVED=yes` to perform the real upload and comment post.

### 7) One-command Jira final pass

If you keep Jira vars in `requirements/.env.jira.local`, you can run:

```bash
npm run workflow:final-pass:jira
```

This command:

- sources `requirements/.env.jira.local`,
- defaults `REQUIREMENTS_REVIEW_PATH` to `requirements/feature_${JIRA_ISSUE_KEY}.md` when not set,
- runs `npm run workflow:final-pass` (which can auto-publish to Jira when enabled).

### 8) Persistent active requirements file

To survive session restart/context compaction, this repo persists the active requirements path in:

- `requirements/.state/active-requirements.txt`

Resolution precedence in `workflow:final-pass`:

1. `REQUIREMENTS_REVIEW_PATH` env var
2. `requirements/.state/active-requirements.txt`
3. prompt inference fallback

Manual helpers:

```bash
npm run requirements:set-active -- --path requirements/feature_19.md
npm run requirements:show-active
```

## What is included in the Web Store Application

- Backend API (`app/backend`) with SQLite seed data (initial specifications):
  - 20 catalog items
  - 5 login users
- React frontend (`app/frontend`) for:
  - Material UI themed interface (professional nav + account menu)
  - login
  - visitor self-registration with auto-login
  - admin-only user management (email/display name/role updates)
  - in-app help page with demo user emails/roles and navigation guidance
  - catalog browsing
  - catalog pagination (page/pageSize query-param deep linking)
  - catalog search (explicit submit, URL-backed query state, clear-search, and no-results messaging)
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

## Optional demo/test password overrides

Default demo/test credentials can be overridden via environment variables:

- `DEMO_USER_PASSWORD`:
  - backend seed password for `user@example.com`.
- `DEMO_TEAM_PASSWORD`:
  - backend seed password for `shopper@example.com`, `manager@example.com`, `editor@example.com`, and `admin@example.com`.
- `DEFAULT_LOGIN_PASSWORD`:
  - Cypress `loginUi()` default password used when a password argument is not provided.

Example:

```bash
DEMO_USER_PASSWORD='MyDemoUserPass1!' DEMO_TEAM_PASSWORD='MyDemoTeamPass1!' DEFAULT_LOGIN_PASSWORD='MyDemoUserPass1!' npm run test:e2e
```

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

This command now also generates a timestamped PDF report in `reports/` (for example `reports/cypress-report-YYYYMMDD-HHmmss.pdf`).

Interactive:

```bash
npm run cypress:open
```

Headless (Cypress only, assumes app is already running):

```bash
npm run cypress:run
```

Headless with PDF report generation (assumes app is already running):

```bash
npm run cypress:run:pdf
```

Accessibility baseline checks (dedicated WCAG-focused suite):

```bash
npm run test:a11y
```

Run accessibility checks only (assumes app is already running):

```bash
npm run cypress:run:a11y
```

Each accessibility run writes a timestamped JSON report to `reports/`:

- `reports/cypressaxe-report-YYYYMMDD-HHmmss.json`

## Accessibility Status

Current accessibility measurement workflow is automated and repeatable:

- Run baseline suite: `npm run test:a11y`
- Run suite against already-running app: `npm run cypress:run:a11y`
- WCAG tags audited by default: `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`

A11y portfolio maintenance rule for new features:

- Before running `npm run test:a11y`, update accessibility coverage artifacts for any new route/page/workflow:
  - `cypress/e2e/accessibility.cy.ts` (new audit scenario/scope),
  - `specs/accessibility.feature` (matching behavior scenario),
  - feature requirements `## What Changed` (note the accessibility coverage update).

Generated artifacts:

- Behavioral test report PDF: `reports/cypress-report-YYYYMMDD-HHmmss.pdf`
- Accessibility JSON report: `reports/cypressaxe-report-YYYYMMDD-HHmmss.json`

Compliance note:

- Passing automated checks is a strong baseline, but final WCAG 2.2 AA compliance also requires manual validation (keyboard-only navigation, screen reader checks, zoom/reflow, and content-level review).
- Default regression runs (`npm run test:e2e`, `npm run cypress:run`) intentionally exclude `cypress/e2e/accessibility.cy.ts` to avoid pending-only entries; accessibility checks run only through `test:a11y` / `cypress:run:a11y`.

What is tested from an accessibility perspective:

- Automated `axe` scans on login, help, store, item detail, checkout, and product form pages.
- WCAG rule tags in scope: `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa`.
- Manual checks (when run) for keyboard navigation, screen reader labels/announcements, zoom/reflow, and key contrast/state signaling.

What is not fully tested from an accessibility perspective:

- Full screen-reader journey parity across all assistive technology/browser combinations.
- Full WCAG content-level and editorial checks (copy clarity, alternative text quality, semantic intent in dynamic content).
- Complete cross-device/mobile assistive-tech matrix validation.
- Formal legal/compliance certification or external audit.

Manual a11y run checklist (recommended):

1. Start the app (`npm run dev` or `npm run dev:clean`) and open `http://localhost:5173`.
2. Validate keyboard-only usage on login, help, store, item detail, checkout, and product form:
  - `Tab`/`Shift+Tab` order is logical,
  - all interactive controls are reachable,
  - visible focus indicator is always present,
  - `Enter`/`Space` triggers expected actions.
3. Validate screen reader semantics (VoiceOver/NVDA):
  - page has one clear heading,
  - form fields have usable labels,
  - buttons/menus/icon actions have meaningful names,
  - error/success messages are announced and understandable.
4. Validate zoom/reflow:
  - browser zoom at 200% and 400% still keeps content readable/operable,
  - no critical clipping/overlap,
  - horizontal scroll is avoided for core workflows where possible.
5. Validate color and non-text contrast:
  - check key text/action contrast in the header, forms, and alerts,
  - ensure state is not conveyed by color alone.
6. Capture notes with browser/version, pages tested, observed issues, and attach latest artifacts from `reports/`.

Run specific specs (argument forwarding supported):

```bash
npm run cypress:run -- --spec cypress/e2e/checkout.cy.ts
```

If Cypress reports that no binary is installed, run:

```bash
npm run cypress:install
npm run cypress:verify
```

If Cypress fails with errors like `bad option: --no-sandbox` or `bad option: --smoke-test`:

- Cause: `ELECTRON_RUN_AS_NODE=1` is set in the current shell/session.
- Fix: unset it before running Cypress:

```bash
unset ELECTRON_RUN_AS_NODE
npm run cypress:verify
```

Project scripts already handle this automatically for Cypress commands.

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
  - Optional query parameter: `q` (max 20 printable characters) applies case-insensitive `contains` filtering across item `name`, `header`, and `description`.
- `GET /api/catalog/:id` returns item detail for a UUID id.
- `GET /api/help` returns navigation guidance for this demo app (no user listing payload).
- `GET /api/admin/roles` returns available role types (admin-only).
- `GET /api/admin/users` returns users for user-management editing (admin-only).
- `PUT /api/admin/users/:id` updates user email/display name/role with final-admin safeguard (admin-only).
- `POST /api/register` creates a new visitor account with default `user` role and returns an authenticated session.
- `POST /api/catalog` allows `editor` and `manager` users to create new catalog items (header/description + price), with UUID generated server-side.
- `PUT /api/catalog/:id` allows `editor` and `manager` users to update catalog item header, description, and price.
- `POST /api/login` returns `user.role` (normalized role name), `user.roleId` (numeric role type id), and `user.displayName`.

## Agent Prompt Templates

Use these prompts to drive the standard feature workflow.  

Start by creating a feature_ or bug_ markdown file with the requirements for the change to be applied to the code base.

Feature analysis prompt:

```text
Please proceed to analyze requirements/feature_<N>.md
```

Bug analysis prompt:

```text
Please proceed to analyze requirements/bug_<N>.md
```

Example:

```text
Please proceed to analyze requirements/feature_4.md
```

Feature implementation prompt:

```text
Please proceed to implement Feature <N>
```

Example:

```text
Please proceed to implement Feature 4
```

Feature implementation + end-of-build review prompt:

```text
Please proceed to implement Feature <N>.
After coding and tests pass, run a final code review using AGENT-REVIEW.md guidance focused on changed files.
Report findings by severity (`Critical`, `High`, `Medium`, `Low`), fix unresolved `Critical`/`High` issues, and summarize remaining medium/low recommendations.
If unresolved `Critical`/`High` findings remain, set `Status: Blocked pending fixes or explicit approval`.
```

Code review request prompt (standalone):

```text
Please run a code review using AGENT-REVIEW.md.
Focus on changed files, report findings first by severity, then list open questions and test gaps.
```

Requirements clarification / decision finalization prompt:

```text
Please update requirements/feature_<N>.md with the following decisions:

For the Open Questions:
1. <decision 1>
2. <decision 2>
3. <decision 3>

Please convert these decisions into explicit requirements and acceptance criteria,
and write them under a new section titled:
## Clarification Decisions

If anything is still unclear, return numbered blocking questions and stop.
```

Example:

```text
Please update requirements/feature_4.md with the following decisions:

For the Open Questions:
1. Also allow manual header override.
2. Make create/edit available on both pages.
3. For non-editor users, disable the control and add a tooltip.

Please convert these decisions into explicit requirements and acceptance criteria,
and write them under a new section titled:
## Clarification Decisions

If anything is still unclear, return numbered blocking questions and stop.
```

Bug variant:

```text
Please update requirements/bug_<N>.md with the following decisions:

For the Open Questions:
1. <decision 1>
2. <decision 2>

Please convert these decisions into explicit requirements and acceptance criteria,
and write them under a new section titled:
## Clarification Decisions

If anything is still unclear, return numbered blocking questions and stop.
```

Template file:

- `AGENT-CLARIFICATION.md`

End-to-end workflow example:

```text
Please proceed to analyze requirements/feature_4.md
Please update requirements/feature_4.md with the following decisions:
For the Open Questions:
1. <decision 1>
2. <decision 2>
Please proceed to implement Feature 4
```

## Agent Files and Sequence

Use these `AGENT-*.md` files for different stages of feature delivery:

- `AGENTS.md`
  - Use for high-level, cross-tool project standards and guardrails.
  - If guidance conflicts, `AGENTS.md` is the baseline policy unless a direct user instruction overrides it.
- `AGENT-CLARIFICATION.md`
  - Use after analysis when open questions need decisions finalized.
  - Supports both `requirements/feature_<N>.md` and `requirements/bug_<N>.md`.
  - Output writes decisions into `## Clarification Decisions` in the same requirements file.
  - If unresolved items remain, return numbered blocking questions and hard stop (no assumptions).
  - Example prompt:
    ```text
    Please update requirements/feature_5.md with the following decisions:

    For the Open Questions:
    1. Keep manager/admin access.
    2. Add tooltip text for disabled controls.

    Please convert these decisions into explicit requirements and acceptance criteria,
    and write them under a new section titled:
    ## Clarification Decisions

    If anything is still unclear, return numbered blocking questions and stop.
    ```
- `AGENT-ANALYSIS.md`
  - Use when you want a full architecture analysis before coding.
  - Supports both `requirements/feature_<N>.md` and `requirements/bug_<N>.md`.
  - Output updates the same requirements file with:
    - `## Technical Analysis`
    - `## Implementation Plan`
    - `## Test Strategy`
    - `## What Changed` (analysis planning updates)
  - If unresolved requirements remain, return numbered blocking questions and hard stop.
  - Example prompt:
    ```text
    Please proceed to analyze requirements/feature_5.md
    ```
    Notes on what to typically expect of the analysis run:
    - current-state gap analysis vs requested behavior
    - finalized architecture decision
    - explicit UI visibility rules by role
    - explicit backend authorization target (manager|editor only for create/edit)
    - detailed file-by-file implementation map
    - data flow, phased build sequence, and critical details
    - `Status: Ready for implementation` or `Status: Blocked pending clarification`
- `AGENT-CYRPRESS.md`
  - Use when generating or refining Cypress artifacts from feature behavior.
  - Output should include/adjust specs, page objects, and E2E tests aligned with project rules.
  - Example prompt:
    ```text
    Please use AGENT-CYRPRESS.md guidance to generate Cypress coverage for Feature 5 from specs/feature5.feature
    ```
- `AGENT-REVIEW.md`
  - Use at the end of implementation as a quality/security review gate.
  - Output should list findings first by severity (`Critical`, `High`, `Medium`, `Low`), followed by open questions, residual risks/test gaps, fix plan, and final status.
  - If unresolved `Critical`/`High` findings remain, set `Status: Blocked pending fixes or explicit approval`.
  - Example prompt:
    ```text
    Please run a final review for Feature 10 using AGENT-REVIEW.md.
    Focus on changed files only, fix unresolved `Critical`/`High` findings, and summarize medium/low follow-ups.
    ```

Recommended sequence once a new feature requirement is written:

1. Run analysis against `requirements/feature_<N>.md` or `requirements/bug_<N>.md` (architecture + plan); if blocking questions remain, stop for clarification answers.
2. Run clarification to resolve open questions and finalize decisions in `## Clarification Decisions`; if blocking questions remain, stop until answers are provided.
3. Implement Feature `<N>` in code.
4. Use Cypress agent guidance to add/update E2E coverage as needed.
5. Update the a11y portfolio for new feature surface area before running accessibility tests.
  - Required updates:
    - `cypress/e2e/accessibility.cy.ts`
    - `specs/accessibility.feature`
    - feature requirements `## What Changed`
6. Run verification (`npm run test:e2e`) and ensure the requirements file has updated `## What Changed`, `## Verification Results`, and `## Review Results`.
7. Run end-of-build review using `AGENT-REVIEW.md`; unresolved `Critical`/`High` findings must be fixed (or explicitly approved) before final handoff.

Workflow helper command:

```bash
npm run workflow:final-pass
```

What it does:

- Runs behavioral verification (`npm run test:e2e`)
- Runs accessibility verification (`npm run test:a11y`)
- Infers the relevant requirements markdown file from chat prompt context (feature/bug reference or explicit `requirements/...md` path).
- If inference is unavailable/ambiguous, use `REQUIREMENTS_REVIEW_PATH` to set the file explicitly.
- Validates that the referenced file is non-empty and includes:
  - `## What Changed`
  - `## Verification Results`
  - `## Review Results`

## FAQ: Are `feature_*.md / bug_*.md` Files Used as Context?

Yes. `requirements/*.md` artifacts are intended to be active context throughout the workflow (clarification -> analysis -> implementation -> review), but they are not always auto-loaded unless referenced or inferred.

How this works in practice:

- `AGENTS.md` and specialized `AGENT-*.md` templates treat the active `requirements/*.md` file as the source-of-truth artifact.
- `workflow:final-pass` attempts to resolve the relevant requirements file from:
  - `REQUIREMENTS_REVIEW_PATH`, or
  - prompt context (`requirements/...md`, `feature <N>`, `bug <N>`).
- The same file is expected to be updated with:
  - `## What Changed`
  - `## Verification Results`
  - `## Review Results`
  - `## Phase Timeline`

Recommendation:

- For reliable context, explicitly reference the file in prompts (for example `@requirements/bug_5.md`) or provide `REQUIREMENTS_REVIEW_PATH=requirements/bug_5.md`.

## PR/Release Checklist

Use this checklist before opening a PR or preparing a release:

- Requirements file for the feature is updated, including `## What Changed`.
- A11y portfolio artifacts are updated for new feature pages/workflows (`cypress/e2e/accessibility.cy.ts`, `specs/accessibility.feature`, requirements `## What Changed`).
- End-to-end verification completed via `npm run workflow:final-pass`.
- Final code review completed using `AGENT-REVIEW.md`.
- Relevant requirements artifact is referenced via `REQUIREMENTS_REVIEW_PATH` and includes non-empty `## What Changed` + `## Verification Results` + `## Review Results`.
- Unresolved `Critical`/`High` review findings are fixed (or explicitly approved); remaining medium/low items are documented.
- Latest generated reports are available in `reports/` (PDF and a11y JSON as applicable).

