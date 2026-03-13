#!/usr/bin/env node
import { jiraRequest, parseArgs, writeOutputFile } from "./lib/jira-client.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/jira/read_issue.mjs --issue SCRUM-1 [--out reports/jira-SCRUM-1.json]",
    "",
    "Required environment:",
    "  JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN",
  ].join("\n");
}

function normalizeDescription(descriptionField) {
  if (!descriptionField) {
    return "";
  }
  if (typeof descriptionField === "string") {
    return descriptionField;
  }

  // Basic extraction for Atlassian Document Format descriptions.
  if (descriptionField.type === "doc" && Array.isArray(descriptionField.content)) {
    const text = [];
    const walk = (node) => {
      if (!node) {
        return;
      }
      if (node.type === "text" && typeof node.text === "string") {
        text.push(node.text);
      }
      if (node.type === "hardBreak") {
        text.push("\n");
      }
      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          walk(child);
        }
        text.push("\n");
      }
    };
    for (const node of descriptionField.content) {
      walk(node);
    }
    return text.join("").replace(/\n{3,}/g, "\n\n").trim();
  }

  return JSON.stringify(descriptionField, null, 2);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const issueKey = args.issue;
  const outputPath = args.out;
  if (!issueKey) {
    throw new Error(`Missing --issue argument.\n\n${usage()}`);
  }

  const issue = await jiraRequest(
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,issuetype,project,status,labels,assignee,reporter`
  );

  const result = {
    key: issue.key,
    id: issue.id,
    summary: issue.fields?.summary ?? "",
    issueType: issue.fields?.issuetype?.name ?? "",
    projectKey: issue.fields?.project?.key ?? "",
    status: issue.fields?.status?.name ?? "",
    labels: issue.fields?.labels ?? [],
    assignee: issue.fields?.assignee?.displayName ?? null,
    reporter: issue.fields?.reporter?.displayName ?? null,
    descriptionText: normalizeDescription(issue.fields?.description),
    rawDescription: issue.fields?.description ?? null,
  };

  const output = JSON.stringify(result, null, 2);
  if (outputPath) {
    await writeOutputFile(outputPath, output);
    process.stdout.write(`Saved issue ${issueKey} to ${outputPath}\n`);
    return;
  }
  process.stdout.write(`${output}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
