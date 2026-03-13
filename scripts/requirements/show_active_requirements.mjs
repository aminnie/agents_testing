#!/usr/bin/env node
import process from "node:process";
import { showActiveRequirementsPath } from "./active-requirements.mjs";

showActiveRequirementsPath().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
