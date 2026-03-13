#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { jiraRequest, parseArgs } from "./lib/jira-client.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/jira/create_requirements_from_issue.mjs --issue SCRUM-1",
    "  node scripts/jira/create_requirements_from_issue.mjs --issue SCRUM-1 --type bug",
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
    return descriptionField.trim();
  }
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
  const type = args.type === "bug" ? "bug" : "feature";

  if (!issueKey) {
    throw new Error(`Missing --issue argument.\n\n${usage()}`);
  }

  const issue = await jiraRequest(
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=summary,description,issuetype,project,status`
  );

  const summary = issue.fields?.summary ?? "";
  const description = normalizeDescription(issue.fields?.description);
  const issueType = issue.fields?.issuetype?.name ?? "";
  const status = issue.fields?.status?.name ?? "";

  const requirementsPath = path.join(
    process.cwd(),
    "requirements",
    `${type}_${issueKey}.md`
  );

  let template = await fs.readFile(
    path.join(process.cwd(), "requirements", "template.md"),
    "utf8"
  );
  template = template.replace(/<role>/g, "Product Owner");
  template = template
    .replace(/<requirement 1>/g, "Capture details from Jira source ticket")
    .replace(/<requirement 2>/g, "Clarify and make requirements testable")
    .replace(/<requirement 3>/g, "Prepare approved requirements for Jira write-back");

  const initialHeader = [
    `# Jira Source: ${issueKey}`,
    "",
    `- Summary: ${summary}`,
    `- Jira Type: ${issueType}`,
    `- Jira Status: ${status}`,
    "",
    "## Original Jira Description",
    "",
    description || "_No description provided in Jira._",
    "",
    "## Working Requirements",
    "",
  ].join("\n");

  await fs.writeFile(requirementsPath, `${initialHeader}${template}\n`, "utf8");
  process.stdout.write(`Created ${path.relative(process.cwd(), requirementsPath)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
