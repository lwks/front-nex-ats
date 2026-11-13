import { expect, test } from '@playwright/test'

test('details and copied short URL open the correct vacancy, with copy feedback', async ({ page }) => {
  const guid = 'fb000000-0000-0000-0000-000000000000'
  const title = 'Vaga compartilhada com hífen'
  const signIn = await page.request.post('/api/local/profile', {
    headers: { origin: 'http://localhost:3100' }, form: { profile: 'COMPANY' }, maxRedirects: 0,
  })
  expect(signIn.status()).toBe(303)
  const created = await page.request.post('/api/jobs', { data: {
    guid_id: guid, titulo: title, descricao: 'Vaga local criada para testar o compartilhamento.',
    cidade: 'São Paulo', estado: 'SP', status: 'Aberto',
  } })
  expect(created.status()).toBe(201)

  await page.goto('/jobs/list')
  await expect(page.getByText(title, { exact: true })).toBeVisible()
  await page.locator('article').filter({ hasText: title }).getByRole('button', { name: 'Ver detalhes' }).click()
  const details = page.getByRole('link', { name: '+ Detalhes' })
  const path = await details.getAttribute('href')
  expect(path).toMatch(/\/jobs\/vaga-compartilhada-com-hifen-[A-Za-z0-9_-]{22}$/)
  expect(path!.slice(-22)).toContain('-')
  await details.click()
  await expect(page).toHaveURL(new RegExp(path!))
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.goto('/jobs/list')
  await page.locator('article').filter({ hasText: title }).getByRole('button', { name: 'Ver detalhes' }).click()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (value: string) => { (window as Window & { copiedJobUrl?: string }).copiedJobUrl = value },
    } })
  })
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click()
  const miniModal = page.getByRole('dialog', { name: 'Compartilhar vaga' })
  await expect(miniModal.getByRole('status')).toHaveText('Link copiado!')
  const url = await miniModal.getByLabel('URL da vaga').inputValue()
  expect(url).toBe(`http://localhost:3100${path}`)
  expect(await page.evaluate(() => (window as Window & { copiedJobUrl?: string }).copiedJobUrl)).toBe(url)
  await miniModal.getByRole('button', { name: 'Copiar novamente' }).click()
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async () => { throw new Error('clipboard unavailable') },
    } })
  })
  await miniModal.getByRole('button', { name: 'Copiar novamente' }).click()
  await expect(miniModal.getByRole('status')).toContainText('copie manualmente')
  await page.goto(url)
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
})
