import { expect, test, type Page } from '@playwright/test'

async function openReady(page: Page, path: string) {
  await page.goto(path)
  await page.waitForLoadState('networkidle')
}

test('reports Supabase auth as enabled when public Supabase variables are present', async ({ request }) => {
  const response = await request.get('/api/auth/session')
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ authEnabled: true, authenticated: false })
})

test('shows the new login on the initial route and rejects incomplete credentials', async ({ page }) => {
  await openReady(page, '/')
  await expect(page.getByRole('heading', { name: 'Cluster' })).toBeVisible()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Preencha e-mail e senha')
})

test('signs in each account type and sends it to the correct page', async ({ page }) => {
  for (const [email, destination] of [
    ['candidate@example.com', '/jobs/list'],
    ['company@example.com', '/empresa/candidaturas'],
  ] as const) {
    await openReady(page, '/api/auth/logout')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('correct-password')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(destination.replaceAll('/', '\\/')))
  }
})

test('blocks company pages and operations for a candidate', async ({ page, request }) => {
  await openReady(page, '/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByLabel('Senha').fill('correct-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/jobs\/list/)
  await page.goto('/empresa/candidaturas')
  await expect(page).toHaveURL(/\/jobs\/list/)
  const cookies = await page.context().cookies()
  const cookieHeader = cookies.map(({ name, value }) => `${name}=${value}`).join('; ')
  const response = await request.post('/api/jobs', { headers: { cookie: cookieHeader }, data: { title: 'Blocked' } })
  expect(response.status()).toBe(403)
})

test('sends password recovery instructions', async ({ page }) => {
  await openReady(page, '/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('status')).toContainText('Enviamos as instruções')
})

test('completes a first OAuth login with an account type', async ({ page }) => {
  await openReady(page, '/')
  await page.getByRole('button', { name: 'Continuar com GitHub' }).click()
  await expect(page).toHaveURL(/mode=complete/)
  await expect(page.getByText('Login autenticado. Escolha seu tipo')).toBeVisible()
  await page.getByRole('button', { name: /Empresa Quero gerenciar vagas/ }).click()
  await expect(page).toHaveURL(/\/empresa\/candidaturas/, { timeout: 15_000 })
})

test('returns to the password update form after a recovery callback', async ({ page }) => {
  await openReady(page, '/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('status')).toContainText('Enviamos as instruções')
  await openReady(page, '/auth/confirm?token_hash=mock-recovery-token&type=recovery')
  await expect(page).toHaveURL(/mode=recover/)
  await expect(page.getByRole('heading', { name: 'Criar nova senha' })).toBeVisible()
  await page.getByLabel('Nova senha', { exact: true }).fill('new-password')
  await page.getByLabel('Confirmar nova senha').fill('new-password')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('status')).toContainText('Senha alterada com sucesso')
})

test('rejects invalid credentials without opening an internal page', async ({ page }) => {
  await openReady(page, '/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByLabel('Senha').fill('wrong-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Invalid login credentials')
  await expect(page).toHaveURL('http://localhost:3000/')
})
