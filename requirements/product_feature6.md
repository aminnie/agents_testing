# Feature 6 Requirements Clarification

## Original Request

As the store Product Owner, I would like to output the Cypress test results into a nicely formatted PDF document.

## Clarified Requirements

### Goal

Generate a human-readable PDF test report after Cypress execution that can be shared with non-technical stakeholders.

### Functional behavior

1. After running Cypress (`npm run cypress:run` or `npm run test:e2e`), produce a PDF report artifact.
2. The PDF should include:
   - test run timestamp
   - environment context (frontend/backend base URL or ports)
   - spec summary (spec file, pass/fail counts, duration)
   - total run summary (total tests, passed, failed, skipped, duration)
3. If failures occur, include failing test names and error summaries in a dedicated section.
4. Report generation should not block Cypress execution from returning its proper exit code.

### Output location and naming

- Save reports to a deterministic folder in the repo (recommended: `reports/`).
- Use a predictable name format (recommended: `cypress-report-YYYYMMDD-HHmmss.pdf`).

### Non-functional expectations

- Output should be deterministic and easy to scan (headings, sections, table-like summary).
- No secrets/tokens should be written into the PDF.
- Keep implementation script-based and reproducible from npm scripts.

## Scope Notes

- This feature is about report generation and packaging, not changing Cypress test logic.
- Existing Cypress specs and page objects should remain unchanged unless needed for report metadata.

## Decision Finalization

1. PDF generation runs for headless flows (`npm run cypress:run:pdf` and `npm run test:e2e`), not interactive `cypress:open`.
2. Failure reporting is text-only (failed test names + error summaries), with no screenshot embedding.
3. Historical PDF files are retained using timestamped filenames.
4. Report generation runs by default in `npm run test:e2e`, and is also available via dedicated `npm run cypress:run:pdf`.

## Current State Observations

- Existing Cypress scripts run tests but do not produce a report artifact.
- `test:e2e` currently orchestrates backend/frontend startup with `start-server-and-test`.
- No `reports/` artifact convention currently exists in repository tooling.

## Architecture Decision

Implement report generation as a script-first pipeline using Cypress Module API + PDF writer:

- Add a Node script that runs Cypress headlessly and receives run result metadata.
- Generate a formatted PDF from run results and save to `reports/`.
- Keep Cypress exit semantics intact:
  - pass -> exit `0`
  - test failures or runner failure -> exit non-zero
- Wire this script into `test:e2e` and expose standalone usage for already-running app environments.

This keeps feature scope isolated to tooling and avoids modifying application runtime code.

## Implementation Map

### Files to Modify

- `package.json`
  - add `cypress:run:pdf` script
  - update `test:e2e` to use PDF-generating run command
  - add PDF generation dependency

- `.gitignore`
  - ignore `reports/` output directory

- `README.md`
  - document PDF report generation behavior and command usage

### Files to Create

- `scripts/run-cypress-with-pdf.mjs`
  - run Cypress via Module API
  - build formatted PDF with summary/spec/failure sections
  - write timestamped PDF report file in `reports/`

## Build Sequence

- [ ] Phase 1: finalize decision set (headless-only, text-only failures, historical reports, default in `test:e2e`)
- [ ] Phase 2: implement report script and output conventions
- [ ] Phase 3: wire npm scripts and dependency updates
- [ ] Phase 4: document usage and artifact behavior in README
- [ ] Phase 5: run lint/verification and confirm artifact generation

## Open Questions

- None currently.

## What Changed

- Finalized all four report behavior decisions:
  - headless-only report generation
  - text-only failure detail section
  - timestamped historical report retention
  - default report generation in `test:e2e` plus standalone script.
- Added reporting dependency and scripts in `package.json`:
  - `cypress:run:pdf`
  - updated `test:e2e` to execute PDF-generating run.
- Implemented `scripts/run-cypress-with-pdf.mjs` to:
  - run Cypress through Module API
  - generate a formatted PDF with run summary, per-spec summary, and failure details
  - write timestamped reports to `reports/`.
- Updated `.gitignore` to exclude `reports/`.
- Updated `README.md` with report-generation commands and artifact location.

### File-by-File Checklist

- [x] `package.json`
  - Added `cypress:run:pdf`.
  - Updated `test:e2e` to produce PDF reports by default.
  - Added `pdfkit` dependency.

- [x] `scripts/run-cypress-with-pdf.mjs`
  - Added report generation pipeline and PDF formatting.

- [x] `.gitignore`
  - Added `reports/` artifact ignore rule.

- [x] `README.md`
  - Added command guidance for PDF report generation.

## Phase Timeline

- 2026-03-11T14:55:20Z | Timeline | Initialized (backfilled to support phase tracking across clarification, analysis, implementation, testing, and review).
