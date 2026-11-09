import { expect, test, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

const JOB_ID = '11111111-1111-4111-8111-111111111111'

async function profile(page: Page, type: 'empresa' | 'candidato') {
  await page.getByRole('button', { name: `Entrar como ${type}`, exact: true }).click()
  await expect(page).toHaveURL(type === 'empresa' ? /empresa\/candidaturas/ : /jobs\/list/)
}

async function selectOption(page: Page, id: string, label: string) {
  await page.locator(`#${id}`).click()
  await page.getByRole("option", { name: label, exact: true }).click()
}

async function selectMultipleOptions(page: Page, id: string, labels: string[]) {
  await page.locator(`#${id}`).click()
  for (const label of labels) {
    await page.locator("label").filter({ has: page.getByText(label, { exact: true }) }).getByRole("checkbox").click()
  }
  await page.keyboard.press("Escape")
}

test('full local flow uses both repositories, persists data and keeps permissions', async ({ page, context }) => {
  test.setTimeout(180_000)
  const remoteRequests: string[] = []
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
      remoteRequests.push(url.href)
      await route.abort()
    } else await route.continue()
  })
  await page.goto('/')
  await expect(page.getByLabel('Ambiente local')).toBeVisible()
  expect((await context.request.post('/api/jobs', { data: { guid_id: 'anonymous' } })).status()).toBe(401)
  await profile(page, 'empresa')
  await expect(page.getByText('Engenheiro de Software Local', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

  // Create through the real UI and the Next proxy into the local Express API.
  await page.goto('/jobs/create')
  await page.locator('#titulo').fill('Vaga criada pelo harness')
  await page.locator('#descricao').fill('Desenvolver aplicações e serviços com testes automatizados para o time local.')
  await selectMultipleOptions(page, 'area', ['Tecnologia da Informação'])
  await selectMultipleOptions(page, 'time', ['DevOps'])
  await selectMultipleOptions(page, 'senioridade', ['Senior'])
  await selectMultipleOptions(page, 'setor', ['Desenvolvimento de Software'])
  await page.locator('#cidade').fill('São Paulo')
  await page.locator('#estado').fill('SP')
  await selectOption(page, 'modelo_trabalho', 'Remoto')
  await selectOption(page, 'formato_contratacao', 'Integral')
  await selectOption(page, 'experiencia', '3-5 anos')
  await selectMultipleOptions(page, 'beneficios', ['Vale refeicao'])
  await selectMultipleOptions(page, 'hardSkills', ['JavaScript'])
  await selectMultipleOptions(page, 'softSkills', ['Colaboracao'])
  await page.locator('#valor_inicial').fill('8000')
  await page.locator('#valor_final').fill('12000')
  await page.getByRole('button', { name: 'Criar vaga', exact: true }).click()
  await expect(page.getByText('Vaga criada com sucesso.', { exact: true })).toBeVisible()
  await expect(page).toHaveURL(/empresa\/candidaturas/)
  const jobs = await (await context.request.get('/api/jobs')).json()
  expect(jobs.data.items.some((job: { titulo: string; owner_sub: string }) => job.titulo === 'Vaga criada pelo harness' && job.owner_sub === 'company')).toBe(true)

  await profile(page, 'candidato')
  expect((await context.request.post('/api/jobs', { data: { guid_id: 'wrong-profile' } })).status()).toBe(403)
  await page.goto('/empresa/candidaturas')
  await expect(page).toHaveURL(/jobs\/list/)
  await page.goto(`/candidaturas?vagaGuid=${JOB_ID}`)
  await expect(page.getByRole('heading', { name: /Dados pessoais|Seu perfil salvo/ })).toBeVisible({ timeout: 30_000 })
  const created = page.waitForResponse(response => response.url().endsWith('/api/candidates/applications') && response.request().method() === 'POST')
  if (await page.getByRole('button', { name: 'Usar informações salvas' }).isVisible()) {
    await page.getByRole('button', { name: 'Usar informações salvas' }).click()
    await page.getByLabel('Pretensão salarial da vaga').fill('12000')
    await page.getByLabel('Mensagem para a empresa').fill('Tenho interesse na vaga.')
    await page.getByLabel('Confirmo o compartilhamento dos meus dados para esta candidatura.').check()
    await page.locator('input[type="file"]').setInputFiles({ name: 'cv-harness.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') })
    await page.getByRole('button', { name: 'Enviar candidatura', exact: true }).click()
  } else {
  await expect(page.locator('#nome')).toBeVisible({ timeout: 30_000 })
  await page.locator("#nome").fill("Candidata Harness")
  await page.locator("#dataNascimento").fill("1992-04-15")
  await page.locator("#documento").fill("12345678909")
  await page.locator("#localResidencia").fill("01001000")
  await expect(page.locator("#cidade")).toHaveValue("São Paulo")
  await page.locator("#contatoCel").fill("11999999999")
  await page.locator("#contato").fill("mariana@clusterhr.com")
  if (await page.locator('#lgpdAccepted').getAttribute('data-state') !== 'checked') await page.locator('#lgpdAccepted').click()
  await page.getByRole("button", { name: "Continuar" }).click()

  await selectOption(page, "experiencia", "3-5 anos")
  await page.locator("#salarioAtual").fill("8000")
  await page.locator("#empresaAtual").fill("ClusterHR")
  await selectOption(page, "setorAtual", "Tecnologia da Informacao (TI)")
  await selectMultipleOptions(page, "industriaInteresse", ["Tecnologia da Informação"])
  await expect(page.locator("#timeAtual")).toBeEnabled()
  await selectMultipleOptions(page, "timeAtual", ["DevOps"])
  await selectOption(page, "senioridade", "Senior")
  await selectMultipleOptions(page, "beneficiosAtuais", ["Vale refeicao"])
  await selectMultipleOptions(page, "hardSkillsProfissionais", ["JavaScript"])
  await selectMultipleOptions(page, "softSkillsProfissionais", ["Colaboracao"])
  await page.getByRole("button", { name: "Continuar" }).click()

  await selectMultipleOptions(page, "areaPreferencia", ["Tecnologia da Informação"])
  await selectMultipleOptions(page, "setor", [
    "Agronegocio",
    "Alimentos e Bebidas",
    "Comercio Varejista",
    "Construcao Civil",
    "Desenvolvimento de Software",
  ])
  await page.locator("#setor").click()
  await expect(
    page.locator("label").filter({ has: page.getByText("E-commerce e Marketplaces", { exact: true }) }).getByRole("checkbox"),
  ).toBeDisabled()
  await page.keyboard.press("Escape")

  await selectMultipleOptions(page, "time", ["DevOps"])
  await selectMultipleOptions(page, "senioridadePreferencia", ["Pleno", "Senior", "Especialista"])
  await page.locator("#senioridadePreferencia").click()
  await expect(
    page.locator("label").filter({ has: page.getByText("Gerente", { exact: true }) }).getByRole("checkbox"),
  ).toBeDisabled()
  await page.keyboard.press("Escape")

  await selectMultipleOptions(page, "tipoContratacao", ["CLT"])
  await selectMultipleOptions(page, "modeloTrabalho", ["Remoto"])
  await selectOption(page, "viagemTrabalho", "Sim")
  await page.locator("#pretensaoSalarial").fill("12000")
  await expect(page.locator("#hardSkills")).toHaveCount(0)
  await expect(page.locator("#softSkills")).toHaveCount(0)
  await page.locator("#sobreVoce").fill("Profissional com experiencia em produto e tecnologia.")
  await page.locator("#compartilhamentoAccepted").click()

  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled()
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(page.getByRole("heading", { name: "Upload de CV" })).toBeVisible()
  await expect(page.getByText("Formatos aceitos: PDF, DOCX ou DOC. Tamanho máximo: 5 MB.")).toBeVisible()
  await page.locator('input[type="file"]').setInputFiles({ name: 'cv-harness.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 e2e') })
  await expect(page.getByText('cv-harness.pdf')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar candidatura', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Revisão final' })).toBeVisible()
  await page.getByRole('button', { name: 'Confirmar candidatura' }).click()
  }
  const response = await created
  expect(response.status()).toBe(201)
  const candidate = (await response.json()).data
  await expect(page.getByRole('heading', { name: 'Candidatura enviada com sucesso!' })).toBeVisible()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Voltar às vagas', exact: true }).click()

  await profile(page, 'empresa')
  await expect(page.getByText(candidate.nome, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  await page.getByText(candidate.nome, { exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Baixar CV' })).toBeVisible()
  await page.getByPlaceholder('Registre observacoes sobre entrevista, proximos passos, riscos ou destaque do perfil.').fill('Entrevista local confirmada')
  await page.getByRole('button', { name: 'Salvar anotacao', exact: true }).click()
  await expect(page.getByText('Anotacao salva com sucesso.', { exact: true })).toBeVisible({ timeout: 30_000 })
  const status = await context.request.put(`/api/candidates/${candidate.id}`, { data: { status: 'entrevista-rh' } })
  expect(status.status()).toBe(200)
  const download = await context.request.get(`/api/candidates/${candidate.id}/cv-download`)
  expect(download.status()).toBe(200)
  const fileUrl = (await download.json()).data.downloadUrl
  expect(new URL(fileUrl).hostname).toBe('localhost')
  const file = await context.request.get(fileUrl)
  expect((await file.body()).toString()).toBe('%PDF-1.4 e2e')
  await page.reload()
  await expect(page.getByText('Entrevista local confirmada', { exact: true }).first()).toBeVisible()
  const persisted = await (await context.request.get(`/api/candidates/by-job-guids?guid_vaga=${JOB_ID}`)).json()
  expect(persisted.data.items.find((item: { id: string }) => item.id === candidate.id)).toMatchObject({ status: 'entrevista-rh', anotacoes: 'Entrevista local confirmada' })
  await page.goto('/empresa/relatorio')
  await expect(page.getByLabel('Ambiente local')).toBeVisible()
  const signedOut = await context.request.get('/api/auth/logout')
  expect(signedOut.ok()).toBe(true)
  expect((await context.request.get('/api/auth/session')).ok()).toBe(true)
  expect(remoteRequests).toEqual([])
})

test('browser creates and closes one vacancy, retains private reason, and blocks candidate application', async ({ page }) => {
  test.setTimeout(120_000)
  const title = `Vaga encerrada ${randomUUID()}`
  const reason = 'Processo concluído no teste integrado'
  await page.goto('/')
  const setProfile = async (value: 'COMPANY' | 'CANDIDATE') => {
    const response = await page.request.post('/api/local/profile', {
      headers: { origin: new URL(page.url()).origin }, form: { profile: value }, maxRedirects: 0,
    })
    expect(response.status()).toBe(303)
  }
  await setProfile('COMPANY')
  await page.goto('/empresa/candidaturas')
  await page.goto('/jobs/create')
  await page.getByLabel('Titulo da vaga').fill(title)
  await page.getByLabel('Descricao').fill('Vaga criada pelo Playwright para testar seu encerramento integrado.')
  await selectMultipleOptions(page, 'area', ['Tecnologia da Informação'])
  await selectMultipleOptions(page, 'time', ['Desenvolvimento Back-end'])
  await selectMultipleOptions(page, 'senioridade', ['Senior'])
  await selectMultipleOptions(page, 'setor', ['Desenvolvimento de Software'])
  await page.getByLabel('Cidade').fill('São Paulo')
  await page.getByLabel('Estado').fill('SP')
  await selectOption(page, 'modelo_trabalho', 'Remoto')
  await selectOption(page, 'formato_contratacao', 'Integral')
  await selectOption(page, 'experiencia', '3-5 anos')
  await selectMultipleOptions(page, 'beneficios', ['Vale refeicao'])
  await selectMultipleOptions(page, 'hardSkills', ['JavaScript'])
  await selectMultipleOptions(page, 'softSkills', ['Colaboracao'])
  await page.getByLabel('Valor inicial (R$)').fill('8000')
  await page.getByLabel('Valor final (R$)').fill('12000')
  const creation = page.waitForResponse(response => response.url().endsWith('/api/jobs') && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Criar vaga' }).click()
  const createdResponse = await creation
  expect(createdResponse.status()).toBe(201)
  const jobId = (await createdResponse.json()).data.guid_id as string
  await expect(page).toHaveURL(/\/empresa\/candidaturas/, { timeout: 20_000 })

  await page.getByRole('button').filter({ hasText: title }).click()
  await page.getByLabel('Motivo do encerramento (opcional)').fill(reason)
  const closing = page.waitForResponse(response => response.url().includes(`/api/jobs/${jobId}/close`) && response.request().method() === 'POST')
  await page.getByRole('button', { name: 'Encerrar vaga' }).click()
  expect((await closing).status()).toBe(200)
  await expect(page.getByRole('button', { name: 'Encerradas', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText(title, { exact: true }).first()).toBeVisible()
  await expect(page.getByText(`Motivo: ${reason}`)).toBeVisible()
  await expect(page.getByText('Pipeline somente leitura: vaga encerrada.')).toBeVisible()

  await setProfile('CANDIDATE')
  await page.goto('/jobs/list')
  await page.goto(`/candidaturas?vagaGuid=${encodeURIComponent(jobId)}`)
  await expect(page.getByRole('heading', { name: 'Vaga encerrada' })).toBeVisible({ timeout: 30_000 })
  await page.goto('/jobs/list')
  const publicCard = page.locator('article').filter({ hasText: title })
  await expect(publicCard).toContainText('Encerrada')
  await expect(publicCard).toContainText('Candidaturas encerradas')
})
