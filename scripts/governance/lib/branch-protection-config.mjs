import { spawnSync } from "node:child_process";

export const DEFAULT_REQUIRED_CHECKS = Object.freeze([
  "required-checks / test-e2e",
  "required-checks / test-a11y",
  "required-checks / workflow-final-pass"
]);

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

function runGhCommand(args, input = "") {
  const result = spawnSync("gh", args, {
    encoding: "utf8",
    input
  });

  if (result.status !== 0) {
    throw new Error(String(result.stderr || result.stdout || "gh command failed").trim());
  }

  return String(result.stdout || "").trim();
}

function resolveRepoName() {
  const ownerFromEnv = String(process.env.GITHUB_OWNER || "").trim();
  const repoFromEnv = String(process.env.GITHUB_REPO || "").trim();
  if (ownerFromEnv && repoFromEnv) {
    return `${ownerFromEnv}/${repoFromEnv}`;
  }

  const nameWithOwner = runGhCommand(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
  if (!nameWithOwner || !nameWithOwner.includes("/")) {
    throw new Error("Unable to resolve repository owner/name via gh CLI.");
  }
  return nameWithOwner;
}

export function resolveBranchProtectionInputs(argv) {
  const options = parseArgs(argv);
  const branch = String(options.branch || process.env.BRANCH_PROTECTION_BRANCH || "main").trim();
  if (!branch) {
    throw new Error("Branch name is required.");
  }

  const requiredChecksInput = String(
    options.requiredChecks
      || process.env.BRANCH_PROTECTION_REQUIRED_CHECKS
      || DEFAULT_REQUIRED_CHECKS.join(",")
  ).trim();
  const requiredChecks = requiredChecksInput
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (requiredChecks.length === 0) {
    throw new Error("At least one required check context is required.");
  }

  const repoName = resolveRepoName();
  return {
    branch,
    repoName,
    requiredChecks,
    dryRun: String(options.dryRun || options["dry-run"] || "false").toLowerCase() === "true"
  };
}

export function buildBranchProtectionPayload(requiredChecks) {
  return {
    required_status_checks: {
      strict: true,
      contexts: requiredChecks
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      dismiss_stale_reviews: true,
      require_code_owner_reviews: false,
      required_approving_review_count: 1
    },
    restrictions: null,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: true,
    lock_branch: false,
    allow_fork_syncing: false
  };
}

export function readBranchProtection(repoName, branch) {
  const output = runGhCommand([
    "api",
    "--method",
    "GET",
    `repos/${repoName}/branches/${branch}/protection`,
    "-H",
    "Accept: application/vnd.github+json"
  ]);
  return JSON.parse(output);
}

export function applyBranchProtection(repoName, branch, payload) {
  const output = runGhCommand([
    "api",
    "--method",
    "PUT",
    `repos/${repoName}/branches/${branch}/protection`,
    "-H",
    "Accept: application/vnd.github+json",
    "--input",
    "-"
  ], `${JSON.stringify(payload)}\n`);
  return JSON.parse(output);
}
