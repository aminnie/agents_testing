---
name: jira-clarification
description: Read Jira issues into requirements files, run clarification updates, and sync approved requirements back to Jira. Use when the user references SCRUM-* tickets, Jira issue keys, or asks to run clarification from Jira.
---

# Jira Clarification Workflow

## Purpose

Execute a deterministic flow:
1. Read Jira issue content.
2. Create `requirements/feature_<ISSUE_KEY>.md` or `requirements/bug_<ISSUE_KEY>.md`.
3. Run requirements clarification using project standards.
4. Write approved requirements back to Jira only after explicit confirmation.

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

4. Write back to Jira only after explicit user approval:

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
