import {
  resolveBranchProtectionInputs,
  buildBranchProtectionPayload,
  readBranchProtection
} from "./lib/branch-protection-config.mjs";

function asSortedString(values) {
  return [...values].sort().join(" | ");
}

async function main() {
  const inputs = resolveBranchProtectionInputs(process.argv.slice(2));
  const expected = buildBranchProtectionPayload(inputs.requiredChecks);
  const actual = readBranchProtection(inputs.repoName, inputs.branch);

  const mismatches = [];

  const actualContexts = actual?.required_status_checks?.contexts || [];
  if (asSortedString(actualContexts) !== asSortedString(expected.required_status_checks.contexts)) {
    mismatches.push({
      field: "required_status_checks.contexts",
      expected: expected.required_status_checks.contexts,
      actual: actualContexts
    });
  }

  const actualStrict = Boolean(actual?.required_status_checks?.strict);
  if (actualStrict !== expected.required_status_checks.strict) {
    mismatches.push({
      field: "required_status_checks.strict",
      expected: expected.required_status_checks.strict,
      actual: actualStrict
    });
  }

  const actualEnforceAdmins = Boolean(actual?.enforce_admins?.enabled);
  if (actualEnforceAdmins !== expected.enforce_admins) {
    mismatches.push({
      field: "enforce_admins",
      expected: expected.enforce_admins,
      actual: actualEnforceAdmins
    });
  }

  const actualReviewCount = Number(actual?.required_pull_request_reviews?.required_approving_review_count || 0);
  if (actualReviewCount !== expected.required_pull_request_reviews.required_approving_review_count) {
    mismatches.push({
      field: "required_pull_request_reviews.required_approving_review_count",
      expected: expected.required_pull_request_reviews.required_approving_review_count,
      actual: actualReviewCount
    });
  }

  const actualDismissStale = Boolean(actual?.required_pull_request_reviews?.dismiss_stale_reviews);
  if (actualDismissStale !== expected.required_pull_request_reviews.dismiss_stale_reviews) {
    mismatches.push({
      field: "required_pull_request_reviews.dismiss_stale_reviews",
      expected: expected.required_pull_request_reviews.dismiss_stale_reviews,
      actual: actualDismissStale
    });
  }

  const actualRequireConversation = Boolean(actual?.required_conversation_resolution?.enabled);
  if (actualRequireConversation !== expected.required_conversation_resolution) {
    mismatches.push({
      field: "required_conversation_resolution",
      expected: expected.required_conversation_resolution,
      actual: actualRequireConversation
    });
  }

  if (mismatches.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          action: "branch-protection-verify-failed",
          repo: inputs.repoName,
          branch: inputs.branch,
          mismatches
        },
        null,
        2
      )
    );
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        action: "branch-protection-verify-passed",
        repo: inputs.repoName,
        branch: inputs.branch,
        requiredChecks: inputs.requiredChecks
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Failed to verify branch protection: ${error.message}`);
  process.exitCode = 1;
});
