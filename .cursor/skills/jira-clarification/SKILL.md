---
name: jira-clarification
description: Read Jira issues into requirements files and run clarification updates. Jira write-back is optional and only used when explicitly requested by the user. Use when the user references SCRUM-* tickets, Jira issue keys, or asks to run clarification from Jira.
---

# Jira Clarification Workflow

## Purpose

Execute a deterministic flow:
1. Read Jira issue content.
2. Create `requirements/feature_<ISSUE_KEY>.md` or `requirements/bug_<ISSUE_KEY>.md`.
3. Run requirements clarification using project standards.
4. Keep requirements markdown as source of truth.
5. Optionally write approved requirements back to Jira only after explicit confirmation.

## Required Environment Variables

- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`

## Command Sequence

1. Read issue:

```bash
npm run jira:read -- --issue SCRUM-1
```

2. Create requirements file from issue:

```bash
npm run jira:req:init -- --issue SCRUM-1
```

3. Clarify requirements using `AGENT-CLARIFICATION.md`:

- Open `requirements/feature_SCRUM-1.md` (or bug variant).
- Update `## Clarification Decisions` sections.
- If unresolved decisions remain, return numbered `### Blocking Questions` and stop.

4. Jira description write-back is optional and only runs on explicit user request:

```bash
npm run jira:update-description -- --issue SCRUM-1 --requirements requirements/feature_SCRUM-1.md --approved yes --dry-run
```

Then execute real update:

```bash
npm run jira:update-description -- --issue SCRUM-1 --requirements requirements/feature_SCRUM-1.md --approved yes --dry-run false
```

## Safety Rules

- Never print API tokens or authorization headers.
- Never run Jira write-back without `--approved yes`.
- Keep dry-run as the default before final write.
- Preserve existing Jira description content and only upsert approved requirements section markers.
- Do not require Jira description updates as part of base clarification workflow.
