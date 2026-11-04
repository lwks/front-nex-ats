import { expect, test } from '@playwright/test'

const jobGuid = '11111111-1111-4111-8111-111111111111'
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
  await page.getByRole('button', { name: 'Entrar como candidato' }).click()
  await expect(page).toHaveURL(/\/jobs\/list/)
  await page.goto(`/candidaturas?vagaGuid=${jobGuid}`)
  await expect(page.getByRole('heading', { name: 'Dados pessoais' })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('#nome')).toHaveValue('')
  const profile = Object.fromEntries(fields.map(field => [field, arrays.has(field) ? ['3'] : 'Candidata Local']))
  const saved = await page.request.put('/api/candidates/me/profile', { data: { profile, lgpdAccepted: true } })
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
