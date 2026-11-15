import { expect, test } from '@playwright/test'

test('lets visitors choose and revise analytics consent', async ({ page }) => {
  test.skip(process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== 'true', 'Requires a configured PostHog test project')

  await page.goto('/jobs/list')
  const preferences = page.getByRole('region', { name: 'Preferências de analytics' })
  await expect(preferences).toBeVisible()
  await page.getByRole('button', { name: 'Recusar' }).click()
  await expect(preferences).toBeHidden()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('clusterhr-analytics-consent'))).toBe('rejected')

  await page.reload()
  await expect(preferences).toBeHidden()
  await page.getByRole('button', { name: 'Preferências de analytics' }).click()
  await page.getByRole('button', { name: 'Aceitar analytics' }).click()
  await expect.poll(() => page.evaluate(() => localStorage.getItem('clusterhr-analytics-consent'))).toBe('accepted')
})
