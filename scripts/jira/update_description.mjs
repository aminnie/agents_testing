#!/usr/bin/env node
import fs from "node:fs/promises";
import { jiraRequest, parseArgs } from "./lib/jira-client.mjs";

const START_MARKER = "<!-- APPROVED_REQUIREMENTS_START -->";
const END_MARKER = "<!-- APPROVED_REQUIREMENTS_END -->";

function usage() {
  return [
    "Usage:",
    "  node scripts/jira/update_description.mjs --issue SCRUM-1 --requirements requirements/feature_SCRUM-1.md --approved yes [--dry-run]",
    "",
    "Required environment:",
    "  JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN",
    "",
    "Safety:",
    "  --approved yes is required for all updates.",
    "  --dry-run is enabled by default; pass --dry-run false to execute update.",
  ].join("\n");
}

function stringifyAdfText(text) {
  return {
    type: "doc",
    version: 1,
    content: text.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

function normalizeDescription(descriptionField) {
  if (!descriptionField) {
    return "";
  }
  if (typeof descriptionField === "string") {
    return descriptionField;
  }
  if (descriptionField.type === "doc" && Array.isArray(descriptionField.content)) {
    const lines = [];
    for (const block of descriptionField.content) {
      if (!Array.isArray(block.content)) {
        lines.push("");
        continue;
      }
      const line = block.content
        .map((node) => (node.type === "text" && node.text ? node.text : ""))
        .join("");
      lines.push(line);
    }
    return lines.join("\n").trim();
  }
  return JSON.stringify(descriptionField, null, 2);
}

function upsertApprovedSection(existingDescription, requirementsBody) {
  const approvedBlock = [
    "## Approved Requirements Update",
    "",
    START_MARKER,
    requirementsBody.trim(),
    END_MARKER,
  ].join("\n");

  if (
    existingDescription.includes(START_MARKER) &&
    existingDescription.includes(END_MARKER)
  ) {
    const replaceRegex = new RegExp(
      `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
      "m"
    );
    return existingDescription.replace(
      replaceRegex,
      `${START_MARKER}\n${requirementsBody.trim()}\n${END_MARKER}`
    );
  }

  const trimmed = existingDescription.trim();
  if (!trimmed) {
    return approvedBlock;
  }
  return `${trimmed}\n\n${approvedBlock}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const issueKey = args.issue;
  const requirementsPath = args.requirements;
  const approved = args.approved;
  const dryRun = args["dry-run"] !== "false";

  if (!issueKey || !requirementsPath) {
    throw new Error(`Missing --issue or --requirements argument.\n\n${usage()}`);
  }
  if (approved !== "yes") {
    throw new Error(`Approval gate failed. Use --approved yes.\n\n${usage()}`);
  }

  const requirementsBody = await fs.readFile(requirementsPath, "utf8");
  const issue = await jiraRequest(
    `/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=description`
  );

  const currentDescription = normalizeDescription(issue.fields?.description);
  const updatedDescription = upsertApprovedSection(currentDescription, requirementsBody);

  if (dryRun) {
    process.stdout.write(
      [
        "Dry-run mode enabled. Jira update not executed.",
        `Issue: ${issueKey}`,
        `Existing description length: ${currentDescription.length}`,
        `Proposed description length: ${updatedDescription.length}`,
      ].join("\n") + "\n"
    );
    return;
  }

  await jiraRequest(`/rest/api/3/issue/${encodeURIComponent(issueKey)}`, {
    method: "PUT",
    body: JSON.stringify({
      fields: {
        description: stringifyAdfText(updatedDescription),
      },
    }),
  });

  process.stdout.write(`Updated Jira issue description for ${issueKey}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
