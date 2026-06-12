import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { UserRegistrationPage } from "@/components/user-registration-page"

describe("UserRegistrationPage", () => {
  it("renders the registration hero and form actions", () => {
    const html = renderToStaticMarkup(<UserRegistrationPage />)

    expect(html).toContain("Crie um usuario para testar o onboarding de acesso.")
    expect(html).toContain("Criar usuario fake")
    expect(html).toContain("Simular erro de criacao")
    expect(html).toContain('href="/jobs/list"')
  })
})
