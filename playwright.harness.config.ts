import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e-harness',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-harness-report', open: 'never' }]],
  outputDir: 'test-results-harness',
  use: {
    baseURL: 'http://localhost:3100', trace: 'retain-on-failure', screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/local-harness.mjs',
    url: 'http://localhost:3100/api/local/health',
    reuseExistingServer: false,
    timeout: 180_000,
    env: { HARNESS_FRONT_PORT: '3100', HARNESS_BACK_PORT: '3101', E2E_SUPABASE_PORT: '54330', HARNESS_DATA_DIR: `.harness/e2e/${Date.now()}` },
  },
})
