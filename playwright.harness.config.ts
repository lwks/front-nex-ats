import { defineConfig, devices } from '@playwright/test'

const frontPort = process.env.HARNESS_FRONT_PORT || '3100'
const backPort = process.env.HARNESS_BACK_PORT || '3101'
const authPort = process.env.E2E_SUPABASE_PORT || '54330'

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
    baseURL: `http://localhost:${frontPort}`, trace: 'retain-on-failure', screenshot: 'only-on-failure',
    actionTimeout: 15_000,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] } : undefined,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/local-harness.mjs',
    url: `http://localhost:${frontPort}/api/local/health`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: { HARNESS_FRONT_PORT: frontPort, HARNESS_BACK_PORT: backPort, E2E_SUPABASE_PORT: authPort, HARNESS_DATA_DIR: `.harness/e2e/${Date.now()}` },
  },
})
