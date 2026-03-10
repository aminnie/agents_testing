import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const WORKSPACE_ROOT = process.cwd();
const REQUIREMENTS_DIR = path.join(WORKSPACE_ROOT, "requirements");
const PROMPT_TEXT = String(process.env.CHAT_PROMPT || process.env.USER_PROMPT || "").trim();

async function fileExists(targetPath) {
  try {
    const stat = await fs.stat(targetPath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function resolveRequirementsReviewPath() {
  if (process.env.REQUIREMENTS_REVIEW_PATH) {
    return path.resolve(WORKSPACE_ROOT, process.env.REQUIREMENTS_REVIEW_PATH);
  }

  const promptPathMatch = PROMPT_TEXT.match(/requirements\/[a-zA-Z0-9._-]+\.md/);
  if (promptPathMatch) {
    const directPath = path.resolve(WORKSPACE_ROOT, promptPathMatch[0]);
    if (await fileExists(directPath)) {
      return directPath;
    }
  }

  const normalizedPrompt = PROMPT_TEXT.toLowerCase();
  const featureMatch = normalizedPrompt.match(/feature\s*(\d+)/);
  if (featureMatch) {
    const featureNumber = featureMatch[1];
    const candidates = [
      path.join(REQUIREMENTS_DIR, `product_feature${featureNumber}.md`),
      path.join(REQUIREMENTS_DIR, `requirements_feature${featureNumber}.md`),
      path.join(REQUIREMENTS_DIR, `analysis_feature${featureNumber}.md`)
    ];
    for (const candidate of candidates) {
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
  }

  const bugMatch = normalizedPrompt.match(/bug\s*(\d+)/);
  if (bugMatch) {
    const bugNumber = bugMatch[1];
    const candidates = [
      path.join(REQUIREMENTS_DIR, `product_bug${bugNumber}.md`)
    ];
    for (const candidate of candidates) {
      if (await fileExists(candidate)) {
        return candidate;
      }
    }
  }

  return "";
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: WORKSPACE_ROOT,
      stdio: "inherit",
      shell: false
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
    });
    child.on("error", reject);
  });
}

async function ensureRequirementsReviewExists(requirementsReviewPath) {
  if (!requirementsReviewPath) {
    throw new Error(
      [
        "Could not infer the requirements review file from the chat prompt.",
        "Provide REQUIREMENTS_REVIEW_PATH with the relevant feature/bug requirements markdown file.",
        "Example: REQUIREMENTS_REVIEW_PATH=requirements/product_feature11.md."
      ].join(" ")
    );
  }

  try {
    const stat = await fs.stat(requirementsReviewPath);
    if (!stat.isFile()) {
      throw new Error("Requirements review path is not a file.");
    }
    const contents = await fs.readFile(requirementsReviewPath, "utf8");
    if (!contents.trim()) {
      throw new Error("Requirements review file is empty.");
    }
    if (!contents.includes("## What Changed")) {
      throw new Error("Requirements review file is missing `## What Changed`.");
    }
    if (!contents.includes("## Verification Results")) {
      throw new Error("Requirements review file is missing `## Verification Results`.");
    }
    if (!contents.includes("## Review Results")) {
      throw new Error("Requirements review file is missing `## Review Results`.");
    }
  } catch {
    throw new Error(
      [
        `Invalid requirements review artifact: ${path.relative(WORKSPACE_ROOT, requirementsReviewPath) || "<unset>"}.`,
        "Use the relevant requirements file and ensure it includes `## What Changed`, `## Verification Results`, and `## Review Results`",
        "before re-running workflow:final-pass."
      ].join(" ")
    );
  }
}

async function main() {
  const requirementsReviewPath = await resolveRequirementsReviewPath();
  await runCommand("npm", ["run", "test:e2e"]);
  await runCommand("npm", ["run", "test:a11y"]);
  await ensureRequirementsReviewExists(requirementsReviewPath);
  // eslint-disable-next-line no-console
  console.log(`Final pass complete with requirements artifact: ${path.relative(WORKSPACE_ROOT, requirementsReviewPath)}`);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("workflow:final-pass failed.", error.message);
  process.exitCode = 1;
});
