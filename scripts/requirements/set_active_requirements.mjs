#!/usr/bin/env node
import process from "node:process";
import { setActiveRequirementsPath } from "./active-requirements.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/requirements/set_active_requirements.mjs --path requirements/feature_19.md",
  ].join("\n");
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) {
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key.slice(2)] = true;
    } else {
      args[key.slice(2)] = next;
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.path) {
    throw new Error(`Missing --path argument.\n\n${usage()}`);
  }
  const relativePath = await setActiveRequirementsPath(args.path);
  process.stdout.write(`Active requirements set to ${relativePath}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
