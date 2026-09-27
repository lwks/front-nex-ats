import { expect, test } from "@playwright/test"

test("opens the candidate registration flow", async ({ page }) => {
  await page.goto("/users/create")

  await expect(page.getByRole("heading", { name: "Crie seu cadastro oficial na plataforma." })).toBeVisible()
  await expect(page.getByText("Dados pessoais", { exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled()
})
