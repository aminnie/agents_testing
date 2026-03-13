#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getAuthHeaders, getBaseUrl, jiraRequest, parseArgs } from "./lib/jira-client.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/jira/publish_final_artifact.mjs --issue SCRUM-1 --requirements requirements/feature_SCRUM-1.md --approved yes [--dry-run]",
    "",
    "Required environment:",
    "  JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN",
    "",
    "Safety:",
    "  --approved yes is required.",
    "  --dry-run is enabled by default; pass --dry-run false to perform upload/comment.",
  ].join("\n");
}

async function uploadAttachment(issueKey, requirementsPath) {
  const baseUrl = getBaseUrl();
  const absolutePath = path.resolve(process.cwd(), requirementsPath);
  const fileName = path.basename(absolutePath);
  const fileBuffer = await fs.readFile(absolutePath);

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: "text/markdown" }), fileName);

  const response = await fetch(
    `${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders({ includeJsonContentType: false }),
        "X-Atlassian-Token": "no-check",
      },
      body: form,
    }
  );

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Jira attachment upload failed (${response.status} ${response.statusText}): ${bodyText}`
    );
  }

  const result = await response.json();
  if (!Array.isArray(result) || result.length === 0) {
    throw new Error("Jira attachment upload succeeded but returned no attachment metadata.");
  }
  return result[0];
}

async function addCompletionComment(issueKey, requirementsPath, attachment) {
  const normalizedPath = path.relative(process.cwd(), path.resolve(process.cwd(), requirementsPath));
  const attachmentUrl = attachment.content || attachment.self || "";
  const attachmentName = attachment.filename || path.basename(requirementsPath);

  const commentBody = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Workflow final pass is complete. The final requirements artifact has been attached.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: `Artifact: ${normalizedPath} (${attachmentName})`,
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Attachment link: ",
            },
            {
              type: "text",
              text: attachmentUrl || "attached file",
              marks: attachmentUrl
                ? [
                    {
                      type: "link",
                      attrs: { href: attachmentUrl },
                    },
                  ]
                : [],
            },
          ],
        },
      ],
    },
  };

  await jiraRequest(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
    method: "POST",
    body: JSON.stringify(commentBody),
  });
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

  const absolutePath = path.resolve(process.cwd(), requirementsPath);
  await fs.access(absolutePath);

  if (dryRun) {
    process.stdout.write(
      [
        "Dry-run mode enabled. Jira attachment/comment were not executed.",
        `Issue: ${issueKey}`,
        `Requirements artifact: ${path.relative(process.cwd(), absolutePath)}`,
      ].join("\n") + "\n"
    );
    return;
  }

  const attachment = await uploadAttachment(issueKey, requirementsPath);
  await addCompletionComment(issueKey, requirementsPath, attachment);
  process.stdout.write(`Published final artifact to ${issueKey}: ${attachment.filename}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
