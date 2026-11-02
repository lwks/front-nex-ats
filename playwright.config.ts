import { defineConfig, devices } from "@playwright/test"

const supabasePort = process.env.E2E_SUPABASE_PORT || '54329'
const frontPort = process.env.E2E_FRONT_PORT || '3000'

export default defineConfig({
  testDir: "./e2e",
  // The local Supabase mock keeps shared auth state, so these scenarios must not
  // revoke or mutate one another's sessions concurrently.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "test-results",
  use: {
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : undefined,
    baseURL: `http://localhost:${frontPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: 'node e2e/mock-supabase.mjs',
      url: `http://localhost:${supabasePort}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port ${frontPort}`,
      url: `http://localhost:${frontPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${supabasePort}`,
        NEXT_DIST_DIR: '.next-e2e',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-public-key',
        SUPABASE_SERVICE_ROLE_KEY: 'e2e-server-key',
      },
    },
  ],
})
