import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import PDFDocument from "pdfkit";
import cypress from "cypress";

const REPORTS_DIR = path.resolve(process.cwd(), "reports");

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatTimestamp(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate())
  ].join("") + "-" + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join("");
}

function formatDateTime(value) {
  if (!value) {
    return "n/a";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return date.toLocaleString();
}

function formatDuration(ms) {
  if (!Number.isFinite(ms)) {
    return "n/a";
  }
  if (ms < 1000) {
    return `${ms} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

function getSpecSummaryRows(result) {
  return (result?.runs || []).map((run) => ({
    spec: run?.spec?.relative || run?.spec?.name || "unknown spec",
    tests: run?.stats?.tests ?? 0,
    passed: run?.stats?.passes ?? 0,
    failed: run?.stats?.failures ?? 0,
    skipped: run?.stats?.skipped ?? 0,
    duration: formatDuration(run?.stats?.wallClockDuration ?? 0)
  }));
}

function getFailureRows(result) {
  const rows = [];
  for (const run of result?.runs || []) {
    const specName = run?.spec?.relative || run?.spec?.name || "unknown spec";
    for (const test of run?.tests || []) {
      if (test?.state !== "failed") {
        continue;
      }
      rows.push({
        spec: specName,
        title: Array.isArray(test?.title) ? test.title.join(" > ") : "Unnamed test",
        error: test?.displayError || "No error details"
      });
    }
  }
  return rows;
}

async function generatePdfReport({
  outputPath,
  result,
  commandContext
}) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = doc.pipe(createWriteStream(outputPath));

    stream.on("finish", resolve);
    stream.on("error", reject);

    doc.fontSize(20).text("Cypress Test Report", { underline: true });
    doc.moveDown(0.6);
    doc.fontSize(11);
    doc.text(`Generated at: ${formatDateTime(commandContext.generatedAt)}`);
    doc.text(`Frontend port: ${commandContext.frontendPort}`);
    doc.text(`Backend port: ${commandContext.backendPort}`);
    doc.text(`Base URL: ${commandContext.baseUrl}`);
    doc.moveDown();

    doc.fontSize(14).text("Run Summary", { underline: true });
    doc.fontSize(11);
    doc.text(`Started: ${formatDateTime(result?.startedTestsAt)}`);
    doc.text(`Ended: ${formatDateTime(result?.endedTestsAt)}`);
    doc.text(`Total tests: ${result?.totalTests ?? 0}`);
    doc.text(`Passed: ${result?.totalPassed ?? 0}`);
    doc.text(`Failed: ${result?.totalFailed ?? 0}`);
    doc.text(`Pending: ${result?.totalPending ?? 0}`);
    doc.text(`Skipped: ${result?.totalSkipped ?? 0}`);
    doc.text(`Duration: ${formatDuration(result?.totalDuration ?? 0)}`);
    doc.moveDown();

    doc.fontSize(14).text("Spec Summary", { underline: true });
    doc.fontSize(10);
    for (const row of getSpecSummaryRows(result)) {
      doc.text(
        `${row.spec} | tests: ${row.tests}, passed: ${row.passed}, failed: ${row.failed}, skipped: ${row.skipped}, duration: ${row.duration}`
      );
    }
    doc.moveDown();

    const failures = getFailureRows(result);
    if (failures.length > 0) {
      doc.fontSize(14).text("Failures", { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(10);
      failures.forEach((failure, index) => {
        doc.text(`${index + 1}. ${failure.spec} | ${failure.title}`);
        doc.text(`   ${failure.error}`);
        doc.moveDown(0.4);
      });
    } else {
      doc.fontSize(14).text("Failures", { underline: true });
      doc.fontSize(10).text("No test failures.");
    }

    doc.end();
  });
}

async function main() {
  const generatedAt = new Date();
  const reportFile = `cypress-report-${formatTimestamp(generatedAt)}.pdf`;
  const outputPath = path.join(REPORTS_DIR, reportFile);
  const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
  const backendPort = Number(process.env.BACKEND_PORT || 4000);
  const baseUrl = `http://localhost:${frontendPort}`;

  const result = await cypress.run({
    config: {
      baseUrl
    }
  });

  if (!result || result?.status === "failed") {
    throw new Error("Cypress failed to execute test run.");
  }

  await generatePdfReport({
    outputPath,
    result,
    commandContext: {
      generatedAt,
      frontendPort,
      backendPort,
      baseUrl
    }
  });

  // eslint-disable-next-line no-console
  console.log(`PDF report generated at ${path.relative(process.cwd(), outputPath)}`);

  if ((result?.totalFailed || 0) > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to run Cypress PDF report generation", error);
  process.exitCode = 1;
});
