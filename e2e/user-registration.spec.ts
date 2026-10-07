import { expect, test, type Page } from "@playwright/test"

async function signIn(page: Page, type: 'candidate' | 'company') {
  await page.goto('/')
  await page.getByLabel('E-mail').fill(`${type}@example.com`)
  await page.getByLabel('Senha').fill('correct-password')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(type === 'company' ? /\/empresa\/candidaturas/ : /\/jobs\/list/)
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

test("opens the candidate registration flow", async ({ page }) => {
  await signIn(page, 'candidate')
  await page.goto("/users/create")

  await expect(page.getByRole("heading", { name: "Crie seu cadastro oficial na plataforma." })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Dados pessoais" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled()
})

test("limits vacancy team selection to three teams from the selected area", async ({ page }) => {
  await signIn(page, 'company')
  await page.route("**/api/areas", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ ID: 3, DS_AREA: "Tecnologia da Informação", competencias: [] }],
      }),
    })
  })

  await page.goto("/jobs/create")
  await page.getByLabel("Cargo").click()
  await page.getByRole("option", { name: "Tech Lead" }).click()

  await page.locator("#area").click()
  await page.getByText("Tecnologia da Informação", { exact: true }).click()

  await page.locator("#time").click()
  await page.getByText("Desenvolvimento Front-end", { exact: true }).click()
  await page.getByText("Desenvolvimento Back-end", { exact: true }).click()
  await page.getByText("DevOps", { exact: true }).click()

  await expect(page.locator("#time")).toContainText("Desenvolvimento Front-end")
  await expect(page.locator("#time")).toContainText("Desenvolvimento Back-end")
  await expect(page.locator("#time")).toContainText("+1")
  await expect(page.getByText("UX Design", { exact: true }).locator("..").getByRole("checkbox")).toBeDisabled()
})

test("allows five sectors and three preferred seniorities in candidate preferences", async ({ page }) => {
  test.setTimeout(60_000)
  await signIn(page, 'candidate')

  await page.route("**/api/areas", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        data: [{ ID: 3, DS_AREA: "Tecnologia da Informação", competencias: [] }],
      }),
    })
  })
  await page.route("**/api/zips/01001000", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        cep: "01001000",
        logradouro: "Praça da Sé",
        localidade: "São Paulo",
        uf: "SP",
      }),
    })
  })

  await page.goto("/users/create")
  await page.locator("#nome").fill("Mariana Costa")
  await page.locator("#dataNascimento").fill("1992-04-15")
  await page.locator("#documento").fill("12345678909")
  await page.locator("#localResidencia").fill("01001000")
  await expect(page.locator("#cidade")).toHaveValue("São Paulo")
  await page.locator("#contatoCel").fill("11999999999")
  await page.locator("#contato").fill("mariana@clusterhr.com")
  await page.locator("#lgpdAccepted").click()
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
  await selectMultipleOptions(page, "hardSkills", ["JavaScript"])
  await selectMultipleOptions(page, "softSkills", ["Colaboracao"])
  await page.locator("#sobreVoce").fill("Profissional com experiencia em produto e tecnologia.")
  await page.locator("#compartilhamentoAccepted").click()

  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled()
  await page.getByRole("button", { name: "Continuar" }).click()
  await expect(page.getByRole("heading", { name: "Upload de CV" })).toBeVisible()
})
