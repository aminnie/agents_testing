import { defineConfig } from "cypress";
import fs from "node:fs";
import path from "node:path";

const frontendPort = Number(process.env.FRONTEND_PORT || 5173);
const runA11ySuite = process.env.CYPRESS_RUN_A11Y === "true";
const REPORTS_DIR = path.resolve(process.cwd(), "reports");

function pad(value) {
  return String(value).padStart(2, "0");
}

function timestampForFile(date = new Date()) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
}

export default defineConfig({
  video: false,
  e2e: {
    baseUrl: `http://localhost:${frontendPort}`,
    excludeSpecPattern: runA11ySuite ? [] : ["cypress/e2e/accessibility.cy.ts"],
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    setupNodeEvents(on) {
      let currentA11yReportPath = null;

      on("task", {
        initA11yReport() {
          ensureReportsDir();
          currentA11yReportPath = path.join(REPORTS_DIR, `cypressaxe-report-${timestampForFile()}.json`);
          const initialPayload = {
            generatedAt: new Date().toISOString(),
            entries: []
          };
          fs.writeFileSync(currentA11yReportPath, JSON.stringify(initialPayload, null, 2));
          return currentA11yReportPath;
        },
        appendA11yReport(entry) {
          if (!currentA11yReportPath) {
            ensureReportsDir();
            currentA11yReportPath = path.join(REPORTS_DIR, `cypressaxe-report-${timestampForFile()}.json`);
            const initialPayload = {
              generatedAt: new Date().toISOString(),
              entries: []
            };
            fs.writeFileSync(currentA11yReportPath, JSON.stringify(initialPayload, null, 2));
          }
          const payload = JSON.parse(fs.readFileSync(currentA11yReportPath, "utf8"));
          payload.entries.push(entry);
          fs.writeFileSync(currentA11yReportPath, JSON.stringify(payload, null, 2));
          return true;
        },
        finalizeA11yReport() {
          return currentA11yReportPath;
        }
      });
    }
  }
});
