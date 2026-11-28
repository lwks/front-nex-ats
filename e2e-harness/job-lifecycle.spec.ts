import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test('closes pending applications, reopens, permits reapplication and freezes previous-cycle results', async ({ page }) => {
  test.setTimeout(150_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error' && message.text().includes('same key')) errors.push(message.text()) })
  const signIn = async (profile: 'COMPANY' | 'CANDIDATE') => {
    expect((await page.request.post('/api/local/profile', {
      headers: { origin: 'http://localhost:3100' }, form: { profile }, maxRedirects: 0,
    })).status()).toBe(303)
  }
  await signIn('COMPANY')
  const jobId = randomUUID(), title = `Vaga ciclos ${jobId.slice(0, 6)}`
  expect((await page.request.post('/api/jobs', { data: { guid_id: jobId, titulo: title, publicada_em: '2026-01-01' } })).status()).toBe(201)
  await signIn('CANDIDATE')
  const arrays = new Set(['beneficiosAtuais', 'timeAtual', 'industriaInteresse', 'hardSkillsProfissionais', 'softSkillsProfissionais', 'tipoContratacao', 'modeloTrabalho', 'setor', 'time', 'senioridadePreferencia', 'areaPreferencia', 'hardSkills', 'softSkills'])
  const fields = ['nome', 'documento', 'dataNascimento', 'localResidencia', 'endereco', 'cidade', 'estado', 'contatoCel', 'contato', 'empresaAtual', 'senioridade', 'beneficiosAtuais', 'experiencia', 'salarioAtual', 'setorAtual', 'timeAtual', 'industriaInteresse', 'hardSkillsProfissionais', 'softSkillsProfissionais', 'tipoContratacao', 'modeloTrabalho', 'setor', 'time', 'senioridadePreferencia', 'areaPreferencia', 'idiomas', 'hardSkills', 'softSkills', 'viagemTrabalho', 'sobreVoce']
  const profile = Object.fromEntries(fields.map(field => [field, field === 'idiomas' ? [] : arrays.has(field) ? ['3'] : 'Pessoa Ciclos Local']))
  profile.contato = 'candidate@example.com'
  const existing = (await (await page.request.get('/api/candidates/me/profile')).json()).data
  const first = await page.request.post('/api/candidates/applications', { data: {
    guid_vaga: jobId, ciclo: 1, mode: 'UPDATE_PROFILE', profile,
    ...(existing ? { profileVersion: existing.version } : {}),
    application: { mensagemEmpresa: 'Primeiro ciclo', pretensaoSalarial: '10000', compartilhamentoAccepted: true, lgpdAccepted: true, cvAction: 'REMOVE' },
  } })
  expect(first.status()).toBe(201)
  const firstId = (await first.json()).data.guid_id as string
  await signIn('COMPANY')
  expect((await page.request.put(`/api/candidates/${firstId}`, { data: { status: 'entrevista-rh', anotacoes: 'Nota privada da empresa' } })).status()).toBe(200)
  await page.goto('/empresa/candidaturas')
  await page.getByLabel('Buscar vagas').fill(title)
  await page.getByRole('button', { name: new RegExp(title) }).click()
  await expect(page.getByTestId(`candidate-card-${firstId}`)).toBeVisible()
  const close = async () => {
    await page.getByRole('button', { name: 'Encerrar vaga', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Encerrar vaga', exact: true })
    await expect(dialog).toContainText('1 candidato(s); 0 sem e-mail.')
    await dialog.getByLabel('Notificar todos os candidatos por e-mail').uncheck()
    await dialog.getByRole('button', { name: 'Confirmar encerramento' }).click()
    await expect(dialog.getByText('Vaga encerrada com sucesso.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
  }
  const reopen = async () => {
    await page.getByRole('button', { name: 'Reabrir vaga', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Reabrir vaga', exact: true })
    await dialog.getByRole('button', { name: 'Confirmar reabertura' }).click()
    await expect(dialog).toHaveCount(0)
  }
  await close()
  await expect(page.getByTestId(`candidate-card-${firstId}`)).toHaveCount(0)
  await page.locator('summary').filter({ hasText: 'Histórico de candidaturas encerradas' }).click()
  await expect(page.getByText(/Candidatura removida da seleção.*Última etapa: Entrevista RH/)).toBeVisible()
  await reopen()
  await expect(page.getByText('Ciclo atual: 2', { exact: true })).toBeVisible()
  expect((await page.request.put(`/api/candidates/${firstId}`, { data: { status: 'contratado' } })).status()).toBe(409)

  await signIn('CANDIDATE')
  await page.goto('/minhas-candidaturas')
  await page.getByRole('button', { name: 'Encerradas', exact: true }).click()
  const previous = page.locator('li').filter({ hasText: title })
  await expect(previous).toContainText('Última etapa: Entrevista RH')
  await expect(previous).not.toContainText('Nota privada')
  await page.goto(`/candidaturas?vagaGuid=${jobId}`)
  await page.getByRole('button', { name: 'Usar informações salvas' }).click()
  await page.getByLabel('Pretensão salarial da vaga').fill('12000')
  await page.getByLabel('Confirmo o compartilhamento dos meus dados para esta candidatura.').check()
  await page.getByRole('button', { name: 'Enviar candidatura', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Candidatura enviada com sucesso!' })).toBeVisible()
  const secondId = (await (await page.request.get(`/api/candidates/me/applications?guid_vaga=${jobId}`)).json()).data.guid_id as string
  expect(secondId).not.toBe(firstId)
  await signIn('COMPANY')
  await page.goto('/empresa/candidaturas')
  await page.getByLabel('Buscar vagas').fill(title)
  await page.getByRole('button', { name: new RegExp(title) }).click()
  const currentCard = page.getByTestId(`candidate-card-${secondId}`)
  await expect(page.getByTestId('status-column-novos').getByTestId(`candidate-card-${secondId}`)).toBeVisible()
  await currentCard.dragTo(page.getByTestId('status-column-entrevista-rh'))
  await expect.poll(async () => (await (await page.request.get(`/api/candidates/${secondId}`)).json()).data.status).toBe('entrevista-rh')
  expect((await page.request.put(`/api/candidates/${secondId}`, { data: { status: 'contratado' } })).status()).toBe(200)
  await page.reload()
  await page.getByLabel('Buscar vagas').fill(title)
  await page.getByRole('button', { name: new RegExp(title) }).click()
  await expect(currentCard).toBeVisible()
  await close()
  const finalCard = page.getByTestId(`candidate-card-${secondId}`)
  await expect(finalCard).toHaveAttribute('draggable', 'false')
  await expect(finalCard).toHaveCSS('cursor', 'not-allowed')
  await reopen()
  await expect(finalCard).toContainText('Ciclo anterior')
  await expect(finalCard).toHaveAttribute('draggable', 'false')
  await finalCard.dragTo(page.getByTestId('status-column-novos'))
  await expect(page.getByTestId('status-column-contratado').getByTestId(`candidate-card-${secondId}`)).toBeVisible()
  await finalCard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Informações do candidato' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Salvar anotacao' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Fechar', exact: true }).click()
  await page.reload()
  await page.getByLabel('Buscar vagas').fill(title)
  await page.getByRole('button', { name: new RegExp(title) }).click()
  await expect(page.getByText('Ciclo atual: 3', { exact: true })).toBeVisible()
  await expect(finalCard).toHaveAttribute('draggable', 'false')
  expect(errors).toEqual([])
})
