import {
  resolveBranchProtectionInputs,
  buildBranchProtectionPayload,
  applyBranchProtection
} from "./lib/branch-protection-config.mjs";

function printPlan({ repoName, branch, requiredChecks, dryRun }, payload) {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        action: dryRun ? "branch-protection-dry-run" : "branch-protection-apply",
        repo: repoName,
        branch,
        requiredChecks,
        payload
      },
      null,
      2
    )
  );
}

async function main() {
  const inputs = resolveBranchProtectionInputs(process.argv.slice(2));
  const payload = buildBranchProtectionPayload(inputs.requiredChecks);

  if (inputs.dryRun) {
    printPlan(inputs, payload);
    return;
  }

  const result = applyBranchProtection(inputs.repoName, inputs.branch, payload);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        action: "branch-protection-applied",
        repo: inputs.repoName,
        branch: inputs.branch,
        requiredChecks: inputs.requiredChecks,
        responseUrl: result.url || ""
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Failed to apply branch protection: ${error.message}`);
  process.exitCode = 1;
});
