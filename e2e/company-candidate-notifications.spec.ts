import { expect, test, type Page } from '@playwright/test'

const jobId = 'synthetic-email-job'
const recipients = [
  { id: 'person-one', name: 'Pessoa Um', hasEmail: true },
  { id: 'person-two', name: 'Pessoa Dois', hasEmail: true },
  { id: 'person-three', name: 'Sem Email', hasEmail: false },
]
async function setup(page: Page) {
  await page.route('**/api/jobs/mine', route => route.fulfill({ json: { data: { items: [{ guid_id: jobId, titulo: 'Vaga de e-mail fictícia', owner_sub: 'company', status: 'Aberto' }] } } }))
  await page.route('**/api/candidates/by-job-guids?*', route => route.fulfill({ json: { data: { items: recipients.map(person => ({ id: person.id, guid_id: person.id, nome: person.name, status: 'novo', guid_vaga: jobId })) } } }))
  await page.route(`**/api/jobs/${jobId}/notifications`, async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { data: recipients } })
    const body = route.request().postDataJSON()
    await route.fulfill({ json: { data: body.candidateId === 'person-one' ? { status: 'accepted', message: 'Aceito pelo serviço de e-mail.' } : { status: 'unknown', message: 'Aceite incerto. Confira a Brevo antes de reenviar.' } } })
  })
  await page.goto('/?mode=login')
  await page.waitForLoadState('networkidle')
  await page.getByLabel('E-mail').fill('company@example.com')
  await page.getByLabel('Senha').fill('correct-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/empresa\/candidaturas/)
  await expect(page.getByRole('button', { name: 'Encerrar vaga', exact: true })).toBeVisible()
}

test('closes a vacancy with reviewed emails, reports partial results and prevents repeated sending', async ({ page }) => {
  await setup(page)
  let closes = 0
  const sent: string[] = []
  await page.route(`**/api/jobs/${jobId}/close`, route => { closes++; return route.fulfill({ json: { data: { status: 'Encerrada' } } }) })
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/notifications')) sent.push(request.postDataJSON().candidateId) })
  await page.getByRole('button', { name: 'Encerrar vaga', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Encerrar vaga', exact: true })
  await expect(dialog.getByText('3 candidato(s); 1 sem e-mail.')).toBeVisible()
  await dialog.getByLabel('Assunto', { exact: true }).fill('Processo seletivo encerrado')
  await dialog.getByLabel('Mensagem', { exact: true }).fill('Agradecemos sua participação.')
  await dialog.getByRole('button', { name: 'Encerrar e notificar' }).click()
  await expect(dialog.getByText('Vaga encerrada com sucesso.')).toBeVisible()
  await expect(dialog.getByRole('status').last()).toContainText('Aceitos: 1. Falhas: 0. Incertos: 1. Sem e-mail: 1.')
  expect(closes).toBe(1)
  expect(sent.sort()).toEqual(['person-one', 'person-two'])
  await expect(dialog.getByRole('button', { name: 'Encerrar e notificar' })).toHaveCount(0)
  await page.screenshot({ path: 'test-results/email-encerramento.png' })
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(page.getByText('Pipeline somente leitura: vaga encerrada.')).toBeVisible()
})

test('sends only to the selected candidate without closing the vacancy', async ({ page }) => {
  await setup(page)
  let closes = 0
  const sent: string[] = []
  await page.route(`**/api/jobs/${jobId}/close`, route => { closes++; return route.fulfill({ status: 500 }) })
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/notifications')) sent.push(request.postDataJSON().candidateId) })
  await page.getByTestId('candidate-card-person-one').click()
  await page.getByRole('button', { name: 'Enviar e-mail', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Enviar e-mail ao candidato', exact: true })
  await expect(dialog.getByText('1 candidato(s); 0 sem e-mail.')).toBeVisible()
  await dialog.getByLabel('Mensagem', { exact: true }).fill('Convite para a próxima etapa.')
  await page.screenshot({ path: 'test-results/email-individual.png' })
  await dialog.getByRole('button', { name: 'Enviar e-mail', exact: true }).click()
  await expect(dialog.getByRole('status')).toContainText('Aceitos: 1.')
  expect(sent).toEqual(['person-one'])
  expect(closes).toBe(0)
})

test('shows closure failure and does not start emails; can then close without notification', async ({ page }) => {
  await setup(page)
  let sends = 0
  let closes = 0
  page.on('request', request => { if (request.method() === 'POST' && request.url().endsWith('/notifications')) sends++ })
  await page.route(`**/api/jobs/${jobId}/close`, route => {
    closes++
    return route.fulfill({ status: closes === 1 ? 500 : 200, json: closes === 1 ? { message: 'Encerramento indisponível.' } : { data: {} } })
  })
  await page.getByRole('button', { name: 'Encerrar vaga', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Encerrar vaga', exact: true })
  await expect(dialog.getByText('3 candidato(s); 1 sem e-mail.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Encerrar e notificar' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('Encerramento indisponível.')
  expect(sends).toBe(0)
  await dialog.getByLabel('Notificar todos os candidatos por e-mail').uncheck()
  await dialog.getByRole('button', { name: 'Confirmar encerramento' }).click()
  await expect(dialog.getByText('Vaga encerrada com sucesso.')).toBeVisible()
  expect(sends).toBe(0)
})

test('blocks notification when recipients cannot be loaded', async ({ page }) => {
  await setup(page)
  await page.route(`**/api/jobs/${jobId}/notifications`, route => route.fulfill({ status: 403, json: { message: 'Destinatários indisponíveis.' } }))
  await page.getByRole('button', { name: 'Encerrar vaga', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Encerrar vaga', exact: true })
  await expect(dialog.getByRole('alert')).toHaveText('Destinatários indisponíveis.')
  await expect(dialog.getByRole('button', { name: 'Encerrar e notificar' })).toBeDisabled()
  await dialog.getByLabel('Notificar todos os candidatos por e-mail').uncheck()
  await expect(dialog.getByRole('button', { name: 'Confirmar encerramento' })).toBeEnabled()
})
