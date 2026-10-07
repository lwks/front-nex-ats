import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: 'node e2e/mock-supabase.mjs',
      url: 'http://localhost:54329/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm.cmd run dev -- --hostname 127.0.0.1",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54329',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-public-key',
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-server-key',
      },
    },
  ],
})
