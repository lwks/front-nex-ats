import { expect, test } from '@playwright/test'

test('previews PDF, explains Word and navigates only the selected vacancy in board order', async ({ page }) => {
  const job = 'synthetic-preview-job'
  const candidates = [
    { id: 'word', nome: 'Candidato Word', status: 'entrevista-rh', cv: { filename: 'cv.docx' } },
    { id: 'pdf', nome: 'Candidato PDF', status: 'novo', cv: { filename: 'cv.pdf' } },
    { id: 'none', nome: 'Candidato Final', status: 'proposta' },
  ].map(candidate => ({ ...candidate, guid_id: candidate.id, guid_vaga: job }))
  await page.route('**/jobs**', route => route.fulfill({ json: [{ guid_id: job, owner_sub: 'company', titulo: 'Vaga de teste CV' }, { guid_id: 'other-job', owner_sub: 'company', titulo: 'Outra vaga' }] }))
  await page.route('**/api/candidates/by-job-guids?*', route => route.fulfill({ json: route.request().url().includes('other-job') && !route.request().url().includes(job) ? [] : candidates }))
  await page.goto('/?mode=login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('E-mail').fill('company@example.com')
  await page.getByLabel('Senha').fill('correct-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/empresa\/candidaturas/)
  await page.getByRole('button').filter({ hasText: 'Vaga de teste CV' }).click()
  await page.getByTestId('candidate-card-pdf').click()
  const modal = page.getByRole('dialog')
  await expect(modal.getByRole('heading', { name: 'Candidato PDF', exact: true })).toBeVisible()
  await expect(modal.getByText('Skills', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Sem skills', { exact: true })).toHaveCount(0)
  const preview = modal.getByRole('link', { name: 'Visualizar CV' })
  await expect(preview).toHaveAttribute('target', '_blank')
  await expect(preview).toHaveAttribute('href', /pdf\/cv-download\?view=inline$/)
  await page.context().route('**/api/candidates/pdf/cv-download?view=inline', route => route.fulfill({ contentType: 'text/html', body: '<h1>PDF de teste</h1>' }))
  const popupPromise = page.waitForEvent('popup')
  await preview.click()
  const popup = await popupPromise
  await expect(popup.getByRole('heading', { name: 'PDF de teste' })).toBeVisible()
  await popup.close()
  await modal.getByRole('button', { name: 'Próximo' }).click()
  await expect(modal.getByRole('heading', { name: 'Candidato Word', exact: true })).toBeVisible()
  await expect(modal.getByText(/Este currículo está em formato Word/)).toBeVisible()
  await expect(modal.getByRole('link', { name: 'Visualizar CV' })).toHaveCount(0)
  await expect(modal.getByRole('button', { name: 'Baixar CV' })).toBeVisible()
  await page.route('**/api/candidates/word/cv-download', route => route.fulfill({ status: 403, json: {} }))
  await modal.getByRole('button', { name: 'Baixar CV' }).click()
  await expect(modal.getByRole('alert')).toContainText('vagas da sua empresa')
  await modal.getByRole('button', { name: 'Próximo' }).click()
  await expect(modal.getByRole('heading', { name: 'Candidato Final', exact: true })).toBeVisible()
  await expect(modal.getByRole('button', { name: 'Próximo' })).toBeDisabled()
  await expect(modal.getByRole('button', { name: 'Baixar CV' })).toHaveCount(0)
  await modal.getByRole('button', { name: 'Fechar' }).click()
  await page.getByRole('button').filter({ hasText: 'Outra vaga', }).click()
  await expect(page.getByTestId('candidate-card-pdf')).toHaveCount(0)
})
