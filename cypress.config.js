import { defineConfig } from "cypress";

const frontendPort = Number(process.env.FRONTEND_PORT || 5173);

export default defineConfig({
  video: false,
  e2e: {
    baseUrl: `http://localhost:${frontendPort}`,
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts"
  }
});
