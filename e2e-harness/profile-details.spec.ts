import { expect, test } from '@playwright/test'

const candidateId = '22222222-2222-4222-8222-222222222222'

test('company sees the candidature snapshot and CV; candidate sees only own profile editing', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar como empresa' }).click()
  await expect(page).toHaveURL(/\/empresa\/candidaturas/)
  await page.goto(`/empresa/candidaturas/${candidateId}`)
  await expect(page.getByRole('heading', { name: 'Detalhes da candidatura' })).toBeVisible()
  await expect(page.getByText('Mariana Local').first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Nenhuma indicação informada.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Baixar CV' })).toBeVisible()
  await expect(page.getByText('Candidatura fictícia do harness.')).toBeVisible()

  await page.goto('/empresa/candidaturas')
  await expect(page.getByLabel('Conta da empresa')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sair' }).first()).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar como candidato' }).click()
  await expect(page).toHaveURL(/\/jobs\/list/)
  await page.getByRole('link', { name: 'Meu perfil' }).click()
  await expect(page).toHaveURL(/\/meu-perfil/)
  await expect(page.getByRole('heading', { name: 'Dados pessoais' })).toBeVisible({ timeout: 30_000 })
  await expect(page.locator('#nome')).toBeVisible()

  const blocked = await page.request.get(`/api/candidates/${candidateId}`)
  expect(blocked.status()).toBe(403)
})

test('candidate edits and saves a reusable profile in the dedicated screen', async ({ page }) => {
  test.setTimeout(180_000)
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar como candidato' }).click()
  const current = (await (await page.request.get('/api/candidates/me/profile')).json()).data
  const profile = {
    nome: 'Ana Local', documento: '52998224725', dataNascimento: '1992-04-15', localResidencia: '01001000',
    endereco: 'Praça da Sé', cidade: 'São Paulo', estado: 'SP', contatoCel: '11999999999', contato: 'candidate@example.com',
    empresaAtual: 'Empresa Local', senioridade: 'senior', beneficiosAtuais: ['vale-refeicao'], experiencia: 'pleno',
    salarioAtual: '8000', setorAtual: 'tecnologia-informacao-ti', timeAtual: ['DevOps'], industriaInteresse: [3],
    hardSkillsProfissionais: ['javascript'], softSkillsProfissionais: ['colaboracao'], tipoContratacao: ['clt'],
    modeloTrabalho: ['remoto'], setor: ['desenvolvimento-software'], time: ['DevOps'], senioridadePreferencia: ['senior'],
    areaPreferencia: [3], idiomas: [], hardSkills: ['javascript'], softSkills: ['colaboracao'], viagemTrabalho: 'sim',
    sobreVoce: 'Experiência em tecnologia e colaboração.',
  }
  const seeded = await page.request.put('/api/candidates/me/profile', { data: { ...(current ? { version: current.version } : {}), profile, lgpdAccepted: true } })
  expect(seeded.status()).toBe(200)
  await page.goto('/meu-perfil')
  await expect(page.locator('#nome')).toHaveValue('Ana Local', { timeout: 30_000 })
  await page.locator('#nome').fill('Ana Atualizada')
  await page.locator('#documento').fill('12345678909')
  await page.locator('#contatoCel').fill('11988888888')
  await page.locator('#dataNascimento').fill('1993-04-15')
  await expect(page.locator('#documento')).toHaveValue('12345678909')
  await expect(page.locator('#contatoCel')).toHaveValue('11988888888')
  await expect(page.locator('#dataNascimento')).toHaveValue('1993-04-15')
  await expect(page.getByText('Você tem alterações não salvas.')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: /Experiência Profissional/ })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.locator('#nome')).toHaveValue('Ana Atualizada')
  await expect(page.locator('#documento')).toHaveValue('12345678909')
  await expect(page.locator('#contatoCel')).toHaveValue('11988888888')
  await expect(page.locator('#dataNascimento')).toHaveValue('1993-04-15')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: /Preferencias e Perfil/ })).toBeVisible()
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Currículo' })).toBeVisible()
  const saveRequest = page.waitForRequest(request => request.url().endsWith('/api/candidates/me/profile') && request.method() === 'PUT')
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  expect((await saveRequest).postDataJSON().profile.nome).toBe('Ana Atualizada')
  await expect(page.getByRole('status')).toContainText('Perfil salvo com sucesso.')
  const updated = (await (await page.request.get('/api/candidates/me/profile')).json()).data
  expect(updated).toMatchObject({ nome: 'Ana Atualizada', documento: '12345678909', contatoCel: '11988888888', dataNascimento: '1993-04-15', version: (await seeded.json()).data.version + 1 })

  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Voltar' }).click()
  await expect(page.locator('#nome')).toHaveValue('Ana Atualizada')
  await page.locator('#contatoCel').fill('11977777777')
  await expect(page.locator('#contatoCel')).toHaveValue('11977777777')
  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Salvar perfil' }).click()
  await expect(page.getByRole('status')).toContainText('Perfil salvo com sucesso.')
  const savedAgain = (await (await page.request.get('/api/candidates/me/profile')).json()).data
  expect(savedAgain).toMatchObject({ contatoCel: '11977777777', version: updated.version + 1 })
})

test('birth date rejects years outside the allowed range', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Entrar como candidato' }).click()
  await page.goto('/meu-perfil')
  const date = page.locator('#dataNascimento')
  await expect(date).toBeVisible({ timeout: 30_000 })
  const year = new Date().getFullYear()
  await expect(date).toHaveAttribute('min', `${year - 100}-01-01`)
  await expect(date).toHaveAttribute('max', `${year + 100}-12-31`)
  await date.fill('0001-01-01')
  await date.blur()
  await expect(date).toHaveAttribute('aria-invalid', 'true')
  await date.fill(`${year - 100}-01-01`)
  await date.blur()
  await expect(date).toHaveAttribute('aria-invalid', 'false')
})
