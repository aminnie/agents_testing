#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const WORKSPACE_ROOT = process.cwd();
export const ACTIVE_REQUIREMENTS_FILE = path.join(
  WORKSPACE_ROOT,
  "requirements",
  ".state",
  "active-requirements.txt"
);

function normalizeRelativeRequirementsPath(inputPath) {
  const normalized = String(inputPath || "").trim();
  if (!normalized) {
    throw new Error("requirements path is required");
  }
  const absolute = path.resolve(WORKSPACE_ROOT, normalized);
  const relative = path.relative(WORKSPACE_ROOT, absolute);
  if (relative.startsWith("..")) {
    throw new Error("requirements path must be inside workspace");
  }
  return relative;
}

export async function setActiveRequirementsPath(inputPath) {
  const relative = normalizeRelativeRequirementsPath(inputPath);
  const stateDir = path.dirname(ACTIVE_REQUIREMENTS_FILE);
  await fs.mkdir(stateDir, { recursive: true });
  await fs.writeFile(ACTIVE_REQUIREMENTS_FILE, `${relative}\n`, "utf8");
  return relative;
}

export async function getActiveRequirementsPath() {
  try {
    const raw = await fs.readFile(ACTIVE_REQUIREMENTS_FILE, "utf8");
    const relative = String(raw || "").trim();
    if (!relative) {
      return "";
    }
    const absolute = path.resolve(WORKSPACE_ROOT, relative);
    const stat = await fs.stat(absolute);
    if (!stat.isFile()) {
      return "";
    }
    return relative;
  } catch {
    return "";
  }
}

export async function showActiveRequirementsPath() {
  const relative = await getActiveRequirementsPath();
  if (!relative) {
    process.stdout.write("No active requirements file is set.\n");
    return;
  }
  process.stdout.write(`${relative}\n`);
}
