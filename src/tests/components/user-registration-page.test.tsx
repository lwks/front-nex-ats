import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { UserRegistrationPage } from "@/components/user-registration-page"

describe("UserRegistrationPage", () => {
  it("renders the official registration flow and removes the generic-account UI", () => {
    const html = renderToStaticMarkup(<UserRegistrationPage />)

    expect(html).toContain("Crie seu cadastro oficial na plataforma.")
    expect(html).toContain("Dados pessoais")
    expect(html).toContain("Dados profissionais")
    expect(html).toContain("Preferencias")
    expect(html).toContain('href="/jobs/list"')
    expect(html).not.toContain("Simular erro de criacao")
    expect(html).not.toContain("Criar usuario fake")
  })
})
