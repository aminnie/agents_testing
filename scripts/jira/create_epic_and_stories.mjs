#!/usr/bin/env node
import fs from "node:fs/promises";
import { jiraRequest, parseArgs, writeOutputFile } from "./lib/jira-client.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/jira/create_epic_and_stories.mjs --seed requirements/jira-containerization-seed.json [--dry-run]",
    "  node scripts/jira/create_epic_and_stories.mjs --seed requirements/jira-containerization-seed.json --dry-run false --out reports/jira-containerization-created.json",
    "",
    "Required environment:",
    "  JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN",
    "",
    "Notes:",
    "  --dry-run is enabled by default; pass --dry-run false to create issues.",
  ].join("\n");
}

function toAdfText(text) {
  const normalized = String(text || "").trim();
  if (!normalized) {
    return undefined;
  }
  return {
    type: "doc",
    version: 1,
    content: normalized.split("\n").map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : [],
    })),
  };
}

async function readJson(path) {
  const raw = await fs.readFile(path, "utf8");
  return JSON.parse(raw);
}

function assertSeed(seed, seedPath) {
  if (!seed || typeof seed !== "object") {
    throw new Error(`Invalid seed format in ${seedPath}`);
  }
  if (!seed.projectKey) {
    throw new Error(`Missing 'projectKey' in ${seedPath}`);
  }
  if (!seed.epic || !seed.epic.summary) {
    throw new Error(`Missing 'epic.summary' in ${seedPath}`);
  }
  if (!Array.isArray(seed.stories) || seed.stories.length === 0) {
    throw new Error(`Missing non-empty 'stories' list in ${seedPath}`);
  }
}

async function getIssueTypeIds(projectKey) {
  const scoped = await jiraRequest(
    `/rest/api/3/issue/createmeta?projectKeys=${encodeURIComponent(
      projectKey
    )}&expand=projects.issuetypes`
  );
  const byName = new Map();
  const scopedIssueTypes = scoped?.projects?.[0]?.issuetypes || [];
  for (const issueType of scopedIssueTypes) {
    if (issueType?.name && issueType?.id) {
      byName.set(String(issueType.name).toLowerCase(), String(issueType.id));
    }
  }
  if (byName.size > 0) {
    return byName;
  }

  const issueTypes = await jiraRequest("/rest/api/3/issuetype");
  for (const issueType of issueTypes || []) {
    if (issueType?.name && issueType?.id) {
      byName.set(String(issueType.name).toLowerCase(), String(issueType.id));
    }
  }
  return byName;
}

async function findEpicNameFieldId() {
  const fields = await jiraRequest("/rest/api/3/field");
  const epicNameField = (fields || []).find(
    (field) =>
      String(field?.name || "").toLowerCase() === "epic name" &&
      String(field?.schema?.type || "").toLowerCase() === "string"
  );
  return epicNameField?.id ? String(epicNameField.id) : null;
}

async function createIssue(fields) {
  const result = await jiraRequest("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify({ fields }),
  });
  return {
    id: result?.id,
    key: result?.key,
    self: result?.self,
  };
}

function normalizeLabels(labels) {
  if (!Array.isArray(labels)) {
    return [];
  }
  return labels
    .map((label) => String(label || "").trim())
    .filter(Boolean);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const seedPath = args.seed;
  const dryRun = args["dry-run"] !== "false";
  const outputPath = args.out;
  if (!seedPath) {
    throw new Error(`Missing --seed argument.\n\n${usage()}`);
  }

  const seed = await readJson(seedPath);
  assertSeed(seed, seedPath);

  const issueTypeIds = await getIssueTypeIds(seed.projectKey);
  const epicTypeName = String(seed.epic.issueType || "Epic").toLowerCase();
  const storyTypeName = String(seed.storyIssueType || "Story").toLowerCase();
  const epicIssueTypeId = issueTypeIds.get(epicTypeName);
  const storyIssueTypeId = issueTypeIds.get(storyTypeName);
  if (!epicIssueTypeId) {
    throw new Error(`Unable to resolve Jira issue type: ${seed.epic.issueType || "Epic"}`);
  }
  if (!storyIssueTypeId) {
    throw new Error(`Unable to resolve Jira issue type: ${seed.storyIssueType || "Story"}`);
  }

  const epicNameFieldId = seed.epic.epicNameFieldId || (await findEpicNameFieldId());
  const epicFields = {
    project: { key: seed.projectKey },
    issuetype: { id: epicIssueTypeId },
    summary: String(seed.epic.summary),
    description: toAdfText(seed.epic.description),
    labels: normalizeLabels(seed.epic.labels),
  };
  if (epicNameFieldId) {
    epicFields[epicNameFieldId] = String(seed.epic.epicName || seed.epic.summary);
  }

  const storyFieldsList = seed.stories.map((story) => ({
    project: { key: seed.projectKey },
    issuetype: { id: storyIssueTypeId },
    summary: String(story.summary || "").trim(),
    description: toAdfText(story.description),
    labels: normalizeLabels(story.labels),
  }));

  for (const [index, storyFields] of storyFieldsList.entries()) {
    if (!storyFields.summary) {
      throw new Error(`Story at index ${index} has empty summary in ${seedPath}`);
    }
  }

  if (dryRun) {
    process.stdout.write(
      `${JSON.stringify(
        {
          dryRun: true,
          projectKey: seed.projectKey,
          epicTypeId: epicIssueTypeId,
          storyTypeId: storyIssueTypeId,
          epicNameFieldId: epicNameFieldId || null,
          epicFields,
          storyCount: storyFieldsList.length,
          stories: storyFieldsList,
        },
        null,
        2
      )}\n`
    );
    return;
  }

  const createdEpic = await createIssue(epicFields);
  const createdStories = [];
  for (const storyFields of storyFieldsList) {
    const createdStory = await createIssue({
      ...storyFields,
      parent: { key: createdEpic.key },
    });
    createdStories.push(createdStory);
  }

  const summary = {
    dryRun: false,
    projectKey: seed.projectKey,
    epic: createdEpic,
    stories: createdStories,
  };
  if (outputPath) {
    await writeOutputFile(outputPath, JSON.stringify(summary, null, 2));
  }
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
