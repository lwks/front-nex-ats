import { expect, test } from '@playwright/test'

test('reports Supabase auth as enabled when public Supabase variables are present', async ({ request }) => {
  const response = await request.get('/api/auth/session')
  expect(response.status()).toBe(200)
  expect(await response.json()).toMatchObject({ authEnabled: true, authenticated: false })
})

test('shows the new login on the initial route and rejects incomplete credentials', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Cluster' })).toBeVisible()
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Preencha e-mail e senha')
})

test('signs in each account type and sends it to the correct page', async ({ page }) => {
  for (const [email, destination] of [
    ['candidate@example.com', '/jobs/list'],
    ['company@example.com', '/empresa/candidaturas'],
  ] as const) {
    await page.goto('/api/auth/logout')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('correct-password')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(destination.replaceAll('/', '\\/')))
  }
})

test('blocks company pages and operations for a candidate', async ({ page, request }) => {
  await page.goto('/')
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

test('supports registration choices and reports a password mismatch', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Cadastre-se' }).click()
  await page.getByRole('button', { name: /Empresa Quero gerenciar vagas/ }).click()
  await expect(page.getByRole('button', { name: /Empresa Quero gerenciar vagas/ })).toHaveAttribute('aria-pressed', 'true')
  await page.getByLabel('Nome').fill('Joana')
  await page.getByLabel('E-mail').fill('joana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('one-password')
  await page.getByLabel('Confirmar senha').fill('other-password')
  await page.getByRole('button', { name: 'Criar conta com e-mail' }).click()
  await expect(page.getByRole('status')).toContainText('As senhas não são iguais')
})

test('registers by email and asks for confirmation when no session is issued', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Cadastre-se' }).click()
  await page.getByRole('button', { name: /Candidato Quero buscar vagas/ }).click()
  await page.getByLabel('Nome').fill('Ana')
  await page.getByLabel('E-mail').fill('ana@example.com')
  await page.getByLabel('Senha', { exact: true }).fill('correct-password')
  await page.getByLabel('Confirmar senha').fill('correct-password')
  await page.getByRole('button', { name: 'Criar conta com e-mail' }).click()
  await expect(page.getByRole('status')).toContainText('Confirme seu e-mail')
  await page.goto('/auth/confirm?token_hash=mock-email-token&type=email')
  await expect(page).toHaveURL(/mode=complete/)
  await page.getByRole('button', { name: /Candidato Quero buscar vagas/ }).click()
  await expect(page).toHaveURL(/\/jobs\/list/, { timeout: 15_000 })
})

test('sends password recovery instructions', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('status')).toContainText('Enviamos as instruções')
})

test('completes a first OAuth login with an account type', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Continuar com GitHub' }).click()
  await expect(page).toHaveURL(/mode=complete/)
  await expect(page.getByText('Login autenticado. Escolha seu tipo')).toBeVisible()
  await page.getByRole('button', { name: /Empresa Quero gerenciar vagas/ }).click()
  await expect(page).toHaveURL(/\/empresa\/candidaturas/, { timeout: 15_000 })
})

test('returns to the password update form after a recovery callback', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
  await expect(page.getByRole('status')).toContainText('Enviamos as instruções')
  await page.goto('/auth/confirm?token_hash=mock-recovery-token&type=recovery')
  await expect(page).toHaveURL(/mode=recover/)
  await expect(page.getByRole('heading', { name: 'Criar nova senha' })).toBeVisible()
  await page.getByLabel('Nova senha', { exact: true }).fill('new-password')
  await page.getByLabel('Confirmar nova senha').fill('new-password')
  await page.getByRole('button', { name: 'Salvar nova senha' }).click()
  await expect(page.getByRole('status')).toContainText('Senha alterada com sucesso')
})

test('rejects invalid credentials without opening an internal page', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('E-mail').fill('candidate@example.com')
  await page.getByLabel('Senha').fill('wrong-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Invalid login credentials')
  await expect(page).toHaveURL('http://localhost:3000/')
})
