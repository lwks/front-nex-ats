import { defineConfig, devices } from "@playwright/test"

import { createRunIdentifier, initializeRunState, productionBaseUrl } from "./e2e-production/support/runtime"

const runId = process.env.PRODUCTION_E2E_RUN_ID?.trim() || createRunIdentifier()
process.env.PRODUCTION_E2E_RUN_ID = runId
initializeRunState(runId)

export default defineConfig({
  testDir: "./e2e-production",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  metadata: { environment: "production", runId },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report-production", open: "never" }],
    ["./e2e-production/reporters/markdown-reporter.ts"],
  ],
  outputDir: "test-results/production",
  use: {
    baseURL: productionBaseUrl(),
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: false,
  },
  projects: [{ name: "production-chromium", use: { ...devices["Desktop Chrome"] } }],
})
