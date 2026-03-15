import { spawnSync } from "node:child_process";

const DEFAULT_BRANCH_PATTERN = /^(feature|bugfix|chore|hotfix)\/(SCRUM-\d+)(-[a-z0-9._-]+)?$/i;
const JIRA_KEY_PATTERN = /\bSCRUM-\d+\b/gi;

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) {
      continue;
    }
    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function runGit(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(String(result.stderr || result.stdout || "git command failed").trim());
  }
  return String(result.stdout || "").trim();
}

function extractJiraKeys(value) {
  const text = String(value || "");
  const matches = text.match(JIRA_KEY_PATTERN) || [];
  return [...new Set(matches.map((key) => key.toUpperCase()))];
}

function readCommitMessages(baseRef, headRef) {
  const range = `${baseRef}..${headRef}`;
  const output = runGit(["log", "--format=%H%x1f%s%x1f%b%x1e", range]);
  if (!output.trim()) {
    return [];
  }
  return output
    .split("\x1e")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [hash = "", subject = "", body = ""] = entry.split("\x1f");
      return {
        hash,
        subject,
        body,
        message: `${subject}\n${body}`.trim()
      };
    });
}

function printReportAndExit(report, hasErrors) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  if (hasErrors) {
    process.exitCode = 1;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const branchName = String(args.branch || process.env.HEAD_REF || "").trim();
  const prTitle = String(args.prTitle || process.env.PR_TITLE || "").trim();
  const baseRef = String(args.base || process.env.BASE_SHA || "origin/main").trim();
  const headRef = String(args.head || process.env.HEAD_SHA || "HEAD").trim();

  const errors = [];

  if (!branchName) {
    errors.push("Missing branch name. Provide --branch or HEAD_REF.");
  }
  if (!prTitle) {
    errors.push("Missing PR title. Provide --prTitle or PR_TITLE.");
  }

  const branchMatch = branchName.match(DEFAULT_BRANCH_PATTERN);
  const branchJiraKey = branchMatch?.[2]?.toUpperCase() || "";
  if (branchName && !branchMatch) {
    errors.push(
      "Branch naming policy failed. Expected format: feature|bugfix|chore|hotfix/SCRUM-<id>-short-description."
    );
  }

  const titleJiraKeys = extractJiraKeys(prTitle);
  if (prTitle && titleJiraKeys.length === 0) {
    errors.push("PR title must include a Jira key (example: SCRUM-25).");
  }
  if (branchJiraKey && titleJiraKeys.length > 0 && !titleJiraKeys.includes(branchJiraKey)) {
    errors.push(
      `PR title Jira key(s) (${titleJiraKeys.join(", ")}) must include branch key ${branchJiraKey}.`
    );
  }

  const commits = readCommitMessages(baseRef, headRef);
  const commitViolations = [];
  for (const commit of commits) {
    const keys = extractJiraKeys(commit.message);
    const isMergeCommit = commit.subject.startsWith("Merge ");
    if (isMergeCommit) {
      continue;
    }
    if (keys.length === 0) {
      commitViolations.push({
        hash: commit.hash,
        subject: commit.subject,
        reason: "Missing Jira key in commit message."
      });
      continue;
    }
    if (branchJiraKey && !keys.includes(branchJiraKey)) {
      commitViolations.push({
        hash: commit.hash,
        subject: commit.subject,
        reason: `Commit Jira key (${keys.join(", ")}) does not include branch key ${branchJiraKey}.`
      });
    }
  }
  if (commitViolations.length > 0) {
    errors.push("One or more commits are missing the required Jira traceability key.");
  }

  printReportAndExit(
    {
      action: "jira-traceability-validation",
      branchName,
      branchJiraKey: branchJiraKey || null,
      prTitle,
      prTitleJiraKeys: titleJiraKeys,
      baseRef,
      headRef,
      commitCount: commits.length,
      commitViolations,
      status: errors.length > 0 ? "failed" : "passed",
      errors
    },
    errors.length > 0
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`jira-traceability-validation failed: ${error.message}`);
  process.exitCode = 1;
});
