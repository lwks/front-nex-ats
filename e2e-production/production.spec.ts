import { expect, test, type Page, type TestInfo } from "@playwright/test"

import type { Gap } from "./support/report-data"
import {
  cleanupRememberedUsers,
  createPreparedAccount,
  getAdminUser,
  rememberSignupEmail,
  uniqueE2eEmail,
  type PreparedAccount,
} from "./support/supabase-admin"
import {
  hasProductionAdminCredentials,
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
  await page.getByLabel("E-mail").fill(account.email)
  await page.getByLabel("Senha").fill(account.password)
  await page.getByRole("button", { name: "Entrar", exact: true }).click()
  await expect(page).toHaveURL(account.accountType === "COMPANY" ? /\/empresa\/candidaturas/ : /\/jobs\/list/)
}

async function signOut(page: Page) {
  await page.goto("/api/auth/logout")
  await expect(page).toHaveURL(/\/$/)
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

test.afterAll(async () => {
  await cleanupRememberedUsers()
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

  test("disponibiliza vagas e opções auxiliares na API real", async ({ request }) => {
    const jobs = await request.get("/api/jobs?limit=6")
    expect(jobs.ok(), `GET /api/jobs retornou ${jobs.status()}`).toBe(true)
    expect((jobs.headers()["content-type"] || "").toLowerCase()).toContain("application/json")

    const apiBase = productionAtsApiBaseUrl()
    const [areas, zip] = await Promise.all([
      request.get(`${apiBase}/areas`),
      request.get(`${apiBase}/zips/01001000`),
    ])
    expect(areas.ok(), `GET /areas retornou ${areas.status()}`).toBe(true)
    expect(zip.ok(), `GET /zips/01001000 retornou ${zip.status()}`).toBe(true)
    const areasPayload = await areas.json() as { data?: unknown[] }
    expect(Array.isArray(areasPayload.data) && areasPayload.data.length > 0).toBe(true)
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
    await expect(details.first()).toBeVisible()
    await details.first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Descrição da vaga" })).toBeVisible()
    await page.getByRole("button", { name: "Fechar detalhes da vaga" }).click()
    await expect(page.getByRole("dialog")).toBeHidden()
  })

  test("redireciona páginas protegidas e bloqueia APIs antes de gravar", async ({ page }, testInfo) => {
    for (const path of ["/users/create", "/candidaturas?vagaGuid=fake", "/jobs/create", "/empresa/candidaturas", "/empresa/relatorio"]) {
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
    await page.goto("/api/auth/logout")
    await expect(page).toHaveURL(/\/$/)
    await page.goto("/api/auth/callback?code=invalid")
    await expect(page).toHaveURL(/\?error=old-callback/)
    await expect(page.getByRole("status")).toContainText("Não foi possível concluir a autenticação")
    await page.goto("/auth/callback?code=invalid")
    await expect(page).toHaveURL(/\?error=callback/)
    await expect(page.getByRole("status")).toContainText("Não foi possível concluir a autenticação")
  })
})

test.describe("Cadastro público", () => {
  test("valida tipo obrigatório, campos vazios e senhas diferentes", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: "Cadastre-se" }).click()
    await expect(page.getByRole("button", { name: "Criar conta com e-mail" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Cadastrar com GitHub" })).toHaveCount(0)
    await page.getByRole("button", { name: /Candidato Quero buscar vagas/ }).click()
    await page.getByRole("button", { name: "Criar conta com e-mail" }).click()
    await expect(page.getByRole("status")).toContainText("Preencha todos os campos")
    await page.getByLabel("Nome").fill("E2E Cadastro")
    await page.getByLabel("E-mail").fill(uniqueE2eEmail("signup-validation"))
    await page.getByLabel("Senha", { exact: true }).fill("E2e-password-1")
    await page.getByLabel("Confirmar senha").fill("E2e-password-2")
    await page.getByRole("button", { name: "Criar conta com e-mail" }).click()
    await expect(page.getByRole("status")).toContainText("As senhas não são iguais")
  })

  for (const [accountType, purpose] of [
    ["Candidato", "signup-candidate"],
    ["Empresa", "signup-company"],
  ] as const) {
    test(`solicita confirmação por e-mail para cadastro de ${accountType}`, async ({ page }, testInfo) => {
      blockUnless(authEnabled && hasProductionAdminCredentials(), "Auth habilitado e credenciais administrativas locais são necessários para cadastro com limpeza garantida.", testInfo)
      const email = uniqueE2eEmail(purpose)
      rememberSignupEmail(email, purpose)
      await page.goto("/")
      await page.getByRole("button", { name: "Cadastre-se" }).click()
      await page.getByRole("button", { name: new RegExp(accountType) }).click()
      await page.getByLabel("Nome").fill(`${accountType} ${productionRunId()}`)
      await page.getByLabel("E-mail").fill(email)
      await page.getByLabel("Senha", { exact: true }).fill("E2e-Signup-Password-9!")
      await page.getByLabel("Confirmar senha").fill("E2e-Signup-Password-9!")
      await page.getByRole("button", { name: "Criar conta com e-mail" }).click()
      await expect(page.getByRole("status")).toContainText("Confirme seu e-mail")
      testInfo.annotations.push({ type: "limitation", description: "Recebimento e uso do link de confirmação não validados." })
    })
  }
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
    await page.goto("/users/create")
    await expect(page).toHaveURL(/\/empresa\/candidaturas/)
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
    await page.locator("#cargo").click()
    await page.getByRole("option", { name: "Tech Lead" }).click()
    if (await page.locator("#nivel").isEnabled()) await selectFirstOption(page, "#nivel")
    await selectFirstOption(page, "#setor")
    await expect(page.locator("#area")).toBeEnabled()
    await selectFirstMultiOption(page, "#area")
    await expect(page.locator("#time")).toBeEnabled()
    await selectFirstMultiOption(page, "#time")
    await page.locator("#localizacao").fill("01001000")
    await expect(page.locator("#cidade_estado")).not.toHaveValue("")
    await page.locator("#modelo_trabalho").click()
    await page.getByRole("option", { name: "Remoto" }).click()
    await page.locator("#formato_contratacao").click()
    await page.getByRole("option", { name: "Integral" }).click()
    await page.locator("#skills").fill("Playwright, TypeScript")
    await page.locator("#beneficios").fill("Benefício E2E")
    await page.locator("#valor_inicial").fill("8000")
    await page.locator("#valor_final").fill("12000")
    const jobRequestPromise = page.waitForRequest((request) => request.url().endsWith("/api/jobs") && request.method() === "POST")
    await page.getByRole("button", { name: "Criar vaga" }).click()
    const jobRequest = await jobRequestPromise
    const jobPayload = jobRequest.postDataJSON() as { guid_id: string }
    await expect(page.getByText("Vaga criado com sucesso")).toBeVisible()
    updateRunState((state) => state.externalRecords.push({ type: "job", identifier: `${jobTitle} (${jobPayload.guid_id})` }))

    await page.goto("/jobs/list")
    await page.getByPlaceholder(/Cargo, empresa, skill/).fill(jobTitle)
    await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible()
    await page.reload()
    await page.getByPlaceholder(/Cargo, empresa, skill/).fill(jobTitle)
    await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible()

    await signOut(page)
    await signIn(page, candidateAccount as PreparedAccount)
    await page.goto(`/candidaturas?vagaGuid=${encodeURIComponent(jobPayload.guid_id)}`)
    await page.locator("#nome").fill(candidateName)
    await page.locator("#documento").fill("1234567")
    await page.locator("#localResidencia").fill("01001000")
    await expect(page.locator("#endereco")).not.toHaveValue("")
    await page.locator("#contatoCel").fill("11999999999")
    await page.locator("#contato").fill(uniqueE2eEmail("application"))
    await page.locator("#lgpd").click()
    await page.getByRole("button", { name: "Continuar" }).click()
    const professionalComboboxes = page.getByRole("combobox")
    await professionalComboboxes.nth(0).click()
    await page.getByRole("option").first().click()
    await professionalComboboxes.nth(1).click()
    await page.getByRole("option").first().click()
    await page.locator("#salario").fill("8000")
    await page.locator("#cargoInteresse").fill("QA E2E")
    await page.getByRole("button", { name: "Continuar" }).click()
    await page.getByRole("button", { name: "Continuar" }).click()
    const interestComboboxes = page.getByRole("combobox")
    for (let index = 0; index < 3; index += 1) {
      await interestComboboxes.nth(index).click()
      await page.getByRole("option").first().click()
    }
    await page.locator("#cargoInteresseDetalhado").fill("QA E2E")
    await page.locator("#compartilhamento").click()
    const candidateRequestPromise = page.waitForRequest((request) => request.url().endsWith("/api/candidates") && request.method() === "POST")
    await page.getByRole("button", { name: "Finalizar Cadastro" }).click()
    const candidateRequest = await candidateRequestPromise
    const candidatePayload = candidateRequest.postDataJSON() as { guid_id: string }
    await expect(page.getByRole("alertdialog")).toContainText("Cadastro enviado com sucesso")
    updateRunState((state) => state.externalRecords.push({ type: "candidate", identifier: `${candidateName} (${candidatePayload.guid_id})` }))

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
    await expect(page.getByText(/Anotacao salva/i)).toBeVisible()
    updateRunState((state) => state.externalRecords.push({ type: "note", identifier: note }))
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

  test("percorre /users/create e registra o GAP de persistência local", async ({ page }, testInfo) => {
    blockUnless(Boolean(candidateAccount), "Conta temporária de Candidato não disponível.", testInfo)
    test.setTimeout(120_000)
    await signIn(page, candidateAccount as PreparedAccount)
    await page.goto("/users/create")
    await expect(page.getByRole("heading", { name: "Crie seu cadastro oficial na plataforma." })).toBeVisible()
    await page.locator("#nome").fill(`${productionRunId()} Perfil`)
    await page.locator("#dataNascimento").fill("1992-04-15")
    await page.locator("#documento").fill("12345678909")
    await page.locator("#localResidencia").fill("01001000")
    await expect(page.locator("#cidade")).not.toHaveValue("")
    await page.locator("#contatoCel").fill("11999999999")
    await page.locator("#contato").fill(uniqueE2eEmail("profile"))
    await page.locator("#lgpdAccepted").click()
    await page.getByRole("button", { name: "Continuar" }).click()

    await selectFirstOption(page, "#experiencia")
    await page.locator("#salarioAtual").fill("8000")
    await page.locator("#empresaAtual").fill("ClusterHR E2E")
    await selectFirstOption(page, "#setorAtual")
    await selectFirstMultiOption(page, "#industriaInteresse")
    await selectFirstMultiOption(page, "#timeAtual")
    await selectFirstOption(page, "#senioridade")
    await selectFirstMultiOption(page, "#beneficiosAtuais")
    await selectFirstMultiOption(page, "#hardSkillsProfissionais")
    await selectFirstMultiOption(page, "#softSkillsProfissionais")
    await page.getByRole("button", { name: "Continuar" }).click()

    await selectFirstMultiOption(page, "#areaPreferencia")
    await selectFirstMultiOption(page, "#setor")
    await selectFirstMultiOption(page, "#time")
    await selectFirstMultiOption(page, "#senioridadePreferencia")
    await selectFirstMultiOption(page, "#tipoContratacao")
    await selectFirstMultiOption(page, "#modeloTrabalho")
    await selectFirstOption(page, "#viagemTrabalho")
    await page.locator("#pretensaoSalarial").fill("12000")
    await selectFirstMultiOption(page, "#hardSkills")
    await selectFirstMultiOption(page, "#softSkills")
    await page.locator("#sobreVoce").fill("Perfil sintético criado pela validação de produção.")
    await page.locator("#compartilhamentoAccepted").click()
    await page.getByRole("button", { name: "Continuar" }).click()
    await expect(page.getByRole("heading", { name: "Upload de CV" })).toBeVisible()

    const writes: string[] = []
    page.on("request", (request) => {
      if (["POST", "PUT", "PATCH"].includes(request.method())) writes.push(request.url())
    })
    await page.getByRole("button", { name: "Finalizar cadastro" }).click()
    await expect(page.getByRole("alertdialog")).toContainText("Cadastro concluido com sucesso")
    expect(writes).toEqual([])
    addGap(testInfo, {
      severity: "medio",
      title: "/users/create confirma sucesso sem persistir o cadastro",
      expected: "O cadastro validado deveria ser persistido em uma API e recuperável depois.",
      observed: "A interface exibiu sucesso sem emitir POST, PUT ou PATCH.",
      impact: "O usuário pode acreditar que o perfil foi salvo, mas os dados se perdem ao fechar ou recarregar a página.",
      recommendation: "Integrar submitUserRegistration a um endpoint persistente e cobrir sucesso e falha da API.",
      evidence: `${testInfo.project.use.baseURL}/users/create`,
    })
  })
})
