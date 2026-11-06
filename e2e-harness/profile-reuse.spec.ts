import { expect, test } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const arrays = new Set(['beneficiosAtuais', 'timeAtual', 'industriaInteresse', 'hardSkillsProfissionais',
  'softSkillsProfissionais', 'tipoContratacao', 'modeloTrabalho', 'setor', 'time', 'senioridadePreferencia',
  'areaPreferencia', 'idiomas', 'hardSkills', 'softSkills'])
const fields = ['nome', 'documento', 'dataNascimento', 'localResidencia', 'endereco', 'cidade', 'estado',
  'contatoCel', 'contato', 'empresaAtual', 'senioridade', 'beneficiosAtuais', 'experiencia', 'salarioAtual',
  'setorAtual', 'timeAtual', 'industriaInteresse', 'hardSkillsProfissionais', 'softSkillsProfissionais',
  'tipoContratacao', 'modeloTrabalho', 'setor', 'time', 'senioridadePreferencia', 'areaPreferencia',
  'idiomas', 'hardSkills', 'softSkills', 'viagemTrabalho', 'sobreVoce']

test('reuses a saved profile, confirms sharing, and blocks a duplicate application', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar como empresa' }).click()
  const jobGuid = randomUUID()
  expect((await page.request.post('/api/jobs', { data: { guid_id: jobGuid, titulo: 'Vaga de reutilização', status: 'Aberto' } })).status()).toBe(201)
  await page.getByRole('button', { name: 'Entrar como candidato' }).click()
  await expect(page).toHaveURL(/\/jobs\/list/)
  const currentProfile = (await (await page.request.get('/api/candidates/me/profile')).json()).data
  const profile = Object.fromEntries(fields.map(field => [field, field === 'idiomas' ? [] : arrays.has(field) ? ['3'] : 'Candidata Local']))
  const saved = await page.request.put('/api/candidates/me/profile', { data: { ...(currentProfile ? { version: currentProfile.version } : {}), profile, lgpdAccepted: true } })
  expect(saved.status()).toBe(200)
  expect((await page.request.get(`/api/candidates/me/applications?guid_vaga=${jobGuid}`)).status()).toBe(200)
  expect((await page.request.get(`/api/jobs/${jobGuid}`)).status()).toBe(200)

  await page.goto(`/candidaturas?vagaGuid=${jobGuid}`)
  await expect(page.getByRole('heading', { name: 'Seu perfil salvo' })).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: 'Revisar e alterar' }).click()
  await expect(page.locator('#nome')).toHaveValue('Candidata Local')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Usar informações salvas' })).toBeVisible({ timeout: 30000 })
  await page.getByRole('button', { name: 'Usar informações salvas' }).click()
  await page.getByLabel('Pretensão salarial da vaga').fill('12000')
  await page.getByLabel('Mensagem para a empresa').fill('Tenho interesse')
  await page.getByLabel('Confirmo o compartilhamento dos meus dados para esta candidatura.').check()
  await page.getByRole('button', { name: 'Enviar candidatura' }).click()
  await expect(page.getByText('Candidatura enviada com sucesso!')).toBeVisible({ timeout: 30000 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Você já se candidatou a esta vaga' })).toBeVisible()
})
