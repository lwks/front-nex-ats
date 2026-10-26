import { expect, test, type Page, type TestInfo } from "@playwright/test"

import type { Gap } from "./support/report-data"
import {
  createPreparedAccount,
  getAdminUser,
  rememberSignupEmail,
  uniqueE2eEmail,
  type PreparedAccount,
} from "./support/supabase-admin"
import {
  hasProductionAdminCredentials,
  productionBaseUrl,
  productionAtsApiBaseUrl,
  productionRunId,
  updateRunState,
} from "./support/runtime"

let authEnabled = false
let candidateAccount: PreparedAccount | null = null
let companyAccount: PreparedAccount | null = null

function addGap(testInfo: TestInfo, gap: Gap) {
  testInfo.annotations.push({ type: "gap", description: JSON.stringify(gap) })
}

function blockUnless(condition: boolean, reason: string, testInfo: TestInfo) {
  if (condition) return
  testInfo.annotations.push({ type: "blocked", description: reason })
  test.skip(true, reason)
}

async function signIn(page: Page, account: PreparedAccount) {
  await page.goto("/")
  await page.waitForLoadState("networkidle")
  await page.getByLabel("E-mail").fill(account.email)
  await page.getByLabel("Senha").fill(account.password)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await expect(page).toHaveURL(account.accountType === "COMPANY" ? /\/empresa\/candidaturas/ : /\/jobs\/list/)
}

async function signOut(page: Page) {
  await page.goto("/api/auth/logout")
  await expect(page).toHaveURL((url) => url.origin === productionBaseUrl() && url.pathname === "/")
  const session = await page.context().request.get("/api/auth/session")
  expect(await session.json()).toMatchObject({ authenticated: false })
}

async function selectFirstOption(page: Page, selector: string) {
  await page.locator(selector).click()
  await page.getByRole("option").first().click()
}

async function selectFirstMultiOption(page: Page, selector: string) {
  await page.locator(selector).click()
  const checkbox = page.locator("label").filter({ has: page.getByRole("checkbox") }).first().getByRole("checkbox")
  await expect(checkbox).toBeEnabled()
  await checkbox.click()
  await page.keyboard.press("Escape")
}

test.beforeAll(async ({ request }) => {
  try {
    const response = await request.get("/api/auth/session")
    const payload = response.ok() ? await response.json() as { authEnabled?: boolean } : {}
    authEnabled = payload.authEnabled === true
    updateRunState((state) => {
      state.authEnabled = authEnabled
      const requestId = response.headers()["x-nf-request-id"]
      const date = response.headers().date
      const etag = response.headers().etag
      if (requestId) state.deployEvidence["x-nf-request-id"] = requestId
      if (date) state.deployEvidence.date = date
      if (etag) state.deployEvidence.etag = etag
    })
  } catch (error) {
    authEnabled = false
    updateRunState((state) => {
      state.authEnabled = false
      state.deployEvidence["preflight-error"] = error instanceof Error ? error.message.slice(0, 200) : "Falha de rede desconhecida"
    })
  }

  if (authEnabled && hasProductionAdminCredentials()) {
    candidateAccount = await createPreparedAccount("CANDIDATE")
    companyAccount = await createPreparedAccount("COMPANY")
  }
})

test.describe("Preflight", () => {
  test("usa HTTPS, carrega a home e os assets essenciais sem erros graves", async ({ page }) => {
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    const failedAssets: string[] = []
    page.on("pageerror", (error) => pageErrors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text())
    })
    page.on("response", (response) => {
      const type = response.request().resourceType()
      if ((type === "script" || type === "stylesheet") && response.status() >= 400) {
        failedAssets.push(`${response.status()} ${response.url()}`)
      }
    })

    const response = await page.goto("/")
    expect(new URL(page.url()).protocol).toBe("https:")
    expect(response?.status()).toBe(200)
    await expect(page.getByRole("heading", { name: "Cluster" })).toBeVisible()
    expect(failedAssets).toEqual([])
    expect(pageErrors).toEqual([])
    expect(consoleErrors).toEqual([])
  })

  test("expõe Supabase Auth habilitado no deploy", async ({ request }, testInfo) => {
    const response = await request.get("/api/auth/session")
    expect(response.status()).toBe(200)
    const payload = await response.json() as { authEnabled?: boolean; authenticated?: boolean }
    if (payload.authEnabled !== true) {
      addGap(testInfo, {
        severity: "critico",
        title: "Supabase Auth desabilitado no deploy",
        expected: "/api/auth/session com authEnabled=true.",
        observed: `/api/auth/session retornou authEnabled=${String(payload.authEnabled)}.`,
        impact: "Login, cadastro autenticado, autorização por tipo e os fluxos completos ficam indisponíveis.",
        recommendation: "Configurar NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY no build da Netlify e publicar um novo deploy.",
        evidence: `${testInfo.project.use.baseURL}/api/auth/session`,
      })
    }
    expect(payload).toMatchObject({ authEnabled: true, authenticated: false })
  })

  test("disponibiliza vagas e CEP na API real", async ({ request }) => {
    const jobs = await request.get("/api/jobs?limit=6")
    expect(jobs.ok(), `GET /api/jobs retornou ${jobs.status()}`).toBe(true)
    expect((jobs.headers()["content-type"] || "").toLowerCase()).toContain("application/json")

    const apiBase = productionAtsApiBaseUrl()
    const zip = await request.get(`${apiBase}/zips/01001000`)
    expect(zip.ok(), `GET /zips/01001000 retornou ${zip.status()}`).toBe(true)
  })
})

test.describe("Sem login", () => {
  test("exibe o login e valida campos obrigatórios", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page.getByRole("status")).toContainText("Preencha e-mail e senha")
  })

  test("rejeita credenciais inválidas", async ({ page }, testInfo) => {
    blockUnless(authEnabled, "Supabase Auth está desabilitado no deploy.", testInfo)
    await page.goto("/")
    await page.getByLabel("E-mail").fill(uniqueE2eEmail("invalid-login"))
    await page.getByLabel("Senha").fill("invalid-password")
    await page.getByRole("button", { name: "Entrar", exact: true }).click()
    await expect(page.getByRole("status")).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })

  test("lista vagas públicas e abre seus detalhes", async ({ page }) => {
    await page.goto("/jobs/list")
    await expect(page.getByRole("heading", { name: /Encontre sua próxima oportunidade/i })).toBeVisible()
    const details = page.getByRole("button", { name: "Ver detalhes" })
    if (await details.count()) {
      await expect(details.first()).toBeVisible()
      await details.first().click()
      await expect(page.getByRole("dialog")).toBeVisible()
      await expect(page.getByRole("heading", { name: "Descrição da vaga" })).toBeVisible()
      await page.getByRole("button", { name: "Fechar detalhes da vaga" }).click()
      await expect(page.getByRole("dialog")).toBeHidden()
    } else {
      await expect(page.getByRole("heading", { name: "Nenhuma vaga disponível no momento" })).toBeVisible()
      await expect(page.getByText("0 vagas encontradas.")).toBeVisible()
    }
  })

  test("mostra carregamento e erro de vagas com falha simulada no navegador", async ({ page }, testInfo) => {
    let releaseResponse = () => {}
    const gate = new Promise<void>((resolve) => { releaseResponse = resolve })
    await page.route("**/api/jobs?*", async (route) => {
      await gate
      await route.fulfill({ status: 500, contentType: "application/json", body: '{"message":"E2E simulated error"}' })
    })
    try {
      await page.goto("/jobs/list")
      await expect(page.locator(".animate-pulse")).toHaveCount(3)
    } finally {
      releaseResponse()
    }
    await expect(page.getByText("Não foi possível carregar as vagas no momento. Tente novamente em instantes.")).toBeVisible()
    testInfo.annotations.push({ type: "limitation", description: "HTTP 500 simulado no navegador por Playwright; não representa falha da API real." })
  })

  test("redireciona páginas protegidas e bloqueia APIs antes de gravar", async ({ page }, testInfo) => {
    for (const path of ["/candidaturas?vagaGuid=fake", "/jobs/create", "/empresa/candidaturas", "/empresa/relatorio"]) {
      await page.goto(path)
      await expect(page).toHaveURL(/\/$/)
    }

    const request = page.context().request
    const responses = await Promise.all([
      request.post("/api/jobs", { data: { titulo: "nao-deve-ser-gravado" } }),
      request.post("/api/candidates", { data: { nome: "nao-deve-ser-gravado" } }),
      request.put("/api/candidates/fake", { data: { status: "novo" } }),
      request.get("/api/candidates/by-job-guids?guid_vaga=fake"),
    ])
    const statuses = responses.map((response) => response.status())
    if (statuses.some((status) => status !== 401)) {
      addGap(testInfo, {
        severity: "alto",
        title: "APIs protegidas não retornam 401 sem sessão quando o Auth está desconfigurado",
        expected: "Cada endpoint protegido deve rejeitar a requisição sem sessão com HTTP 401 antes de qualquer encaminhamento.",
        observed: `Os endpoints retornaram ${statuses.join(", ")}.`,
        impact: "Clientes não distinguem ausência de autenticação de indisponibilidade de configuração; a proteção não fica comprovada pelo contrato esperado.",
        recommendation: "Publicar as variáveis Supabase e repetir o teste; manter 401 para sessão ausente e reservar 503 para falha operacional autenticada.",
        evidence: "/api/jobs, /api/candidates e /api/candidates/:id no deploy publicado.",
      })
    }
    expect(statuses).toEqual([401, 401, 401, 401])
  })

  test("trata logout sem sessão e callbacks inválidos de forma controlada", async ({ page }) => {
    await signOut(page)
    await page.goto("/api/auth/callback?code=invalid")
    await expect(page).toHaveURL(/\?error=old-callback/)
    await expect(page.getByRole("status")).toContainText("Não foi possível concluir a autenticação")
    await page.goto("/auth/callback?code=invalid")
    await expect(page).toHaveURL(/\?error=callback/)
    await expect(page.getByRole("status")).toContainText("Não foi possível concluir a autenticação")
  })

  test("mantém indisponível a rota legada /users/create", async ({ request }) => {
    const response = await request.get("/users/create", { maxRedirects: 0 })
    expect(response.status()).toBe(404)
  })
})

test.describe("Cadastro público", () => {
  test("valida tipo obrigatório, campos vazios e senhas diferentes", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.getByRole("button", { name: "Cadastre-se" }).click()
    await expect(page.getByRole("button", { name: "Criar conta com e-mail" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Cadastrar com GitHub" })).toHaveCount(0)
    await page.getByRole("button", { name: /Candidato Quero buscar vagas/ }).click()
    await page.getByRole("button", { name: "Criar conta com e-mail" }).click()
    await expect(page.getByRole("alertdialog")).toContainText("Preencha todos os campos")
    await page.getByRole("button", { name: "Revisar cadastro" }).click()
    await page.getByLabel("Nome").fill("E2E Cadastro")
    await page.getByLabel("E-mail").fill(uniqueE2eEmail("signup-validation"))
    await page.getByLabel("Senha", { exact: true }).fill("E2e-password-1")
    await page.getByLabel("Confirmar senha").fill("E2e-password-2")
    await page.getByRole("button", { name: "Criar conta com e-mail" }).click()
    await expect(page.getByRole("alertdialog")).toContainText("As senhas não são iguais")
    await page.getByRole("button", { name: "Revisar cadastro" }).click()
    await page.getByRole("button", { name: "Alterar tipo da conta" }).click()
    await page.getByRole("button", { name: /Empresa Quero gerenciar vagas/ }).click()
    await expect(page.getByLabel("Nome")).toBeVisible()
    await expect(page.getByRole("button", { name: "Criar conta com e-mail" })).toBeVisible()
  })

  test("solicita confirmação por e-mail em execução controlada", async ({ page }, testInfo) => {
      blockUnless(authEnabled && hasProductionAdminCredentials() && process.env.PRODUCTION_E2E_SEND_EMAIL === "true", "Envio real de e-mail desativado; configure PRODUCTION_E2E_SEND_EMAIL=true para uma tentativa controlada.", testInfo)
      const accountType = "Candidato"
      const email = uniqueE2eEmail("signup-candidate")
      await page.goto("/")
      await page.waitForLoadState("networkidle")
      await page.getByRole("button", { name: "Cadastre-se" }).click()
      await page.getByRole("button", { name: new RegExp(accountType) }).click()
      await page.getByLabel("Nome").fill(`${productionRunId()} ${accountType}`)
      await page.getByLabel("E-mail").fill(email)
      await page.getByLabel("Senha", { exact: true }).fill("E2e-Signup-Password-9!")
      await page.getByLabel("Confirmar senha").fill("E2e-Signup-Password-9!")
      await page.getByRole("button", { name: "Criar conta com e-mail" }).click()
      const feedback = await page.getByRole("alertdialog").innerText()
      const user = await rememberSignupEmail(email, "signup-candidate")
      if (/rate limit|limite de envio/i.test(feedback)) {
        testInfo.annotations.push({ type: "blocked", description: `Supabase bloqueou o envio de confirmação: ${feedback.slice(0, 160)}` })
        test.skip(true, "Limite de envio de e-mail do Supabase atingido.")
      }
      expect(feedback).toContain("Confirme seu e-mail")
      expect(user?.id, "Cadastro aceito sem usuário identificado no Supabase").toBeTruthy()
      testInfo.annotations.push({ type: "limitation", description: "Recebimento e uso do link de confirmação não validados." })
  })
})

test.describe("Autenticação e autorização", () => {
  test("conclui o primeiro login, persiste sessão e impede alteração do tipo", async ({ page }, testInfo) => {
    blockUnless(Boolean(candidateAccount && companyAccount), "Contas administrativas temporárias não puderam ser preparadas.", testInfo)
    const candidate = candidateAccount as PreparedAccount
    const company = companyAccount as PreparedAccount

    for (const account of [candidate, company]) {
      await signIn(page, account)
      const expectedPath = account.accountType === "COMPANY" ? "/empresa/candidaturas" : "/jobs/list"
      await expect(page).toHaveURL(new RegExp(expectedPath.replaceAll("/", "\\/")))
      const session = await page.context().request.get("/api/auth/session")
      expect(await session.json()).toMatchObject({ authenticated: true, accountType: account.accountType })
      await page.reload()
      await expect(page).toHaveURL(new RegExp(expectedPath.replaceAll("/", "\\/")))

      const otherType = account.accountType === "COMPANY" ? "CANDIDATE" : "COMPANY"
      const attemptedChange = await page.context().request.post("/api/auth/account-type", { data: { accountType: otherType } })
      expect(attemptedChange.ok()).toBe(true)
      expect(await attemptedChange.json()).toMatchObject({ accountType: account.accountType })
      expect((await getAdminUser(account.id)).app_metadata.account_type).toBe(account.accountType)
      await signOut(page)
      expect(await (await page.context().request.get("/api/auth/session")).json()).toMatchObject({ authenticated: false })
    }
  })

  test("bloqueia Candidato em páginas e APIs de Empresa", async ({ page }, testInfo) => {
    blockUnless(Boolean(candidateAccount), "Conta temporária de Candidato não disponível.", testInfo)
    await signIn(page, candidateAccount as PreparedAccount)
    await page.goto("/empresa/candidaturas")
    await expect(page).toHaveURL(/\/jobs\/list/)
    expect((await page.context().request.post("/api/jobs", { data: { title: "blocked" } })).status()).toBe(403)
    expect((await page.context().request.put("/api/candidates/fake", { data: { status: "novo" } })).status()).toBe(403)
  })

  test("bloqueia Empresa em páginas e APIs de Candidato", async ({ page }, testInfo) => {
    blockUnless(Boolean(companyAccount), "Conta temporária de Empresa não disponível.", testInfo)
    await signIn(page, companyAccount as PreparedAccount)
    await page.goto("/candidaturas?vagaGuid=fake")
    await expect(page).toHaveURL(/\/empresa\/candidaturas/)
    expect((await page.context().request.post("/api/candidates", { data: { name: "blocked" } })).status()).toBe(403)
  })
})

test.describe("OAuth", () => {
  for (const [button, provider] of [["Continuar com GitHub", "github"], ["Continuar com LinkedIn", "linkedin_oidc"]] as const) {
    test(`inicia ${provider} com callback no domínio publicado`, async ({ page }, testInfo) => {
      blockUnless(authEnabled, "Supabase Auth está desabilitado no deploy.", testInfo)
      await page.route("**/auth/v1/authorize**", (route) => route.abort())
      await page.goto("/")
      const requestPromise = page.waitForRequest((request) => request.url().includes("/auth/v1/authorize"))
      await page.getByRole("button", { name: button }).click()
      const request = await requestPromise
      const url = new URL(request.url())
      expect(url.searchParams.get("provider")).toBe(provider)
      expect(url.searchParams.get("redirect_to")).toBe(`${testInfo.project.use.baseURL}/auth/callback`)
      testInfo.annotations.push({ type: "limitation", description: `Login completo no provedor ${provider} não executado.` })
    })
  }
})

test.describe("Fluxo funcional completo", () => {
  test("cria vaga, envia candidatura, atualiza pipeline e valida relatório", async ({ page }, testInfo) => {
    blockUnless(Boolean(candidateAccount && companyAccount), "Contas temporárias autenticadas não estão disponíveis.", testInfo)
    test.setTimeout(180_000)
    const jobTitle = `${productionRunId()} Vaga QA`
    const candidateName = `${productionRunId()} Candidato Teste`
    const note = `${productionRunId()} anotação validada`

    await signIn(page, companyAccount as PreparedAccount)
    await page.goto("/jobs/create")
    await page.locator("#titulo").fill(jobTitle)
    await page.locator("#descricao").fill("Vaga automatizada para validar criação, candidatura e persistência no ambiente publicado.")
    await expect(page.locator("#area")).toBeEnabled()
    await page.locator("#area").click()
    await expect(page.getByText("Finanças", { exact: true })).toBeVisible()
    await page.keyboard.press("Escape")
    await selectFirstMultiOption(page, "#area")
    await expect(page.locator("#time")).toBeEnabled()
    await selectFirstMultiOption(page, "#time")
    await selectFirstMultiOption(page, "#senioridade")
    await selectFirstMultiOption(page, "#setor")
    await page.locator("#cidade").fill("São Paulo")
    await page.locator("#estado").fill("SP")
    await page.locator("#modelo_trabalho").click()
    await page.getByRole("option", { name: "Remoto" }).click()
    await page.locator("#formato_contratacao").click()
    await page.getByRole("option", { name: "Integral" }).click()
    await selectFirstOption(page, "#experiencia")
    await selectFirstMultiOption(page, "#beneficios")
    await selectFirstMultiOption(page, "#hardSkills")
    await selectFirstMultiOption(page, "#softSkills")
    await page.locator("#valor_inicial").fill("8000")
    await page.locator("#valor_final").fill("12000")
    const jobRequestPromise = page.waitForRequest((request) => request.url().endsWith("/api/jobs") && request.method() === "POST")
    await page.getByRole("button", { name: "Criar vaga" }).click()
    const jobRequest = await jobRequestPromise
    const jobPayload = jobRequest.postDataJSON() as { guid_id: string }
    updateRunState((state) => state.externalRecords.push({ type: "job", id: jobPayload.guid_id, identifier: jobTitle, creationStatus: "submitted", cleanupStatus: "pending" }))
    await expect(page.getByText("Vaga criada com sucesso.", { exact: true })).toBeVisible()
    updateRunState((state) => { state.externalRecords.find((record) => record.type === "job" && record.id === jobPayload.guid_id)!.creationStatus = "confirmed" })

    await page.goto("/jobs/list")
    await page.getByPlaceholder(/Cargo, empresa, skill ou localidade/i).fill(jobTitle)
    await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible()
    await page.reload()
    await page.getByPlaceholder(/Cargo, empresa, skill ou localidade/i).fill(jobTitle)
    await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible()

    await signOut(page)
    await signIn(page, candidateAccount as PreparedAccount)
    await page.goto(`/candidaturas?vagaGuid=${encodeURIComponent(jobPayload.guid_id)}`)
    await page.locator("#nome").fill(candidateName)
    await page.locator("#dataNascimento").fill("1992-04-15")
    await page.locator("#documento").fill("1234567")
    await page.locator("#localResidencia").fill("01001000")
    await page.locator("#endereco").fill("Praca da Se, 1")
    await page.locator("#cidade").fill("Sao Paulo")
    await page.locator("#estado").fill("SP")
    await page.locator("#contatoCel").fill("11999999999")
    await page.locator("#contato").fill(uniqueE2eEmail("application"))
    await page.locator("#lgpdAccepted").click()
    await page.getByRole("button", { name: "Continuar" }).click()
    await selectFirstOption(page, "#experiencia")
    await page.locator("#salarioAtual").fill("8000")
    await page.locator("#empresaAtual").fill("Empresa E2E")
    await selectFirstOption(page, "#setorAtual")
    await selectFirstMultiOption(page, "#industriaInteresse")
    await selectFirstMultiOption(page, "#timeAtual")
    await selectFirstOption(page, "#senioridade")
    await selectFirstMultiOption(page, "#beneficiosAtuais")
    await selectFirstMultiOption(page, "#hardSkillsProfissionais")
    await selectFirstMultiOption(page, "#softSkillsProfissionais")
    await page.getByRole("button", { name: "Continuar" }).click()
    await selectFirstMultiOption(page, "#areaPreferencia")
    await page.locator("#areaPreferencia").click()
    await expect(page.getByText("Recursos Humanos", { exact: true })).toBeVisible()
    await page.keyboard.press("Escape")
    await selectFirstMultiOption(page, "#setor")
    await selectFirstMultiOption(page, "#time")
    await selectFirstMultiOption(page, "#senioridadePreferencia")
    await selectFirstMultiOption(page, "#tipoContratacao")
    await selectFirstMultiOption(page, "#modeloTrabalho")
    await selectFirstOption(page, "#viagemTrabalho")
    await page.locator("#pretensaoSalarial").fill("10000")
    await selectFirstMultiOption(page, "#hardSkills")
    await selectFirstMultiOption(page, "#softSkills")
    await page.locator("#sobreVoce").fill("Perfil de teste para validar candidatura e pipeline.")
    await page.locator("#compartilhamentoAccepted").click()
    await page.getByRole("button", { name: "Continuar" }).click()
    const candidateRequestPromise = page.waitForRequest((request) => request.url().endsWith("/api/candidates") && request.method() === "POST")
    await expect(page.getByText(/Upload temporariamente desativado/i)).toBeVisible()
    await page.getByRole("button", { name: "Enviar candidatura" }).click()
    const candidateRequest = await candidateRequestPromise
    const candidatePayload = candidateRequest.postDataJSON() as { guid_id: string }
    updateRunState((state) => state.externalRecords.push({ type: "candidate", id: candidatePayload.guid_id, relatedId: jobPayload.guid_id, identifier: candidateName, creationStatus: "submitted", cleanupStatus: "pending" }))
    await expect(page.getByRole("alertdialog")).toContainText("Candidatura enviada com sucesso!")
    updateRunState((state) => { state.externalRecords.find((record) => record.type === "candidate" && record.id === candidatePayload.guid_id)!.creationStatus = "confirmed" })

    await signOut(page)
    await signIn(page, companyAccount as PreparedAccount)
    await page.getByLabel("Buscar vagas").fill(jobTitle)
    await page.getByRole("button").filter({ hasText: jobTitle }).click()
    const candidateCard = page.getByRole("button").filter({ hasText: candidateName })
    await expect(candidateCard).toBeVisible()
    await candidateCard.click()
    await page.getByPlaceholder(/Registre observacoes/).fill(note)
    const noteResponsePromise = page.waitForResponse((response) => response.url().includes("/api/candidates/") && response.request().method() === "PUT")
    await page.getByRole("button", { name: "Salvar anotacao" }).click()
    expect((await noteResponsePromise).ok()).toBe(true)
    updateRunState((state) => state.externalRecords.push({ type: "note", id: candidatePayload.guid_id, relatedId: jobPayload.guid_id, identifier: note, creationStatus: "confirmed", cleanupStatus: "pending" }))
    await expect(page.getByText(/Anotacao salva/i)).toBeVisible()
    await page.getByRole("button", { name: "Fechar" }).click()

    const card = page.getByText(candidateName, { exact: true }).locator("xpath=ancestor::*[@draggable='true']")
    const targetColumn = page.getByTestId("status-column-entrevista-rh")
    const statusResponsePromise = page.waitForResponse((response) => response.url().includes("/api/candidates/") && response.request().method() === "PUT")
    await card.dragTo(targetColumn)
    expect((await statusResponsePromise).ok()).toBe(true)
    await page.reload()
    await page.getByLabel("Buscar vagas").fill(jobTitle)
    await page.getByRole("button").filter({ hasText: jobTitle }).click()
    await expect(page.getByTestId("status-column-entrevista-rh")).toContainText(candidateName)
    await expect(page.getByTestId("status-column-entrevista-rh")).toContainText(note)

    await page.goto("/empresa/relatorio")
    await expect(page.getByRole("heading", { name: "Indicadores operacionais" })).toBeVisible()
    await expect(page.getByRole("option", { name: jobTitle })).toBeAttached()
  })

})
