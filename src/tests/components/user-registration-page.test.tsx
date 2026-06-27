import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { UserRegistrationPage } from "@/components/user-registration-page"
import { UserRegistrationPersonalStep } from "@/components/steps/user-registration-personal-step"
import { UserRegistrationPreferencesStep } from "@/components/steps/user-registration-preferences-step"
import { UserRegistrationProfessionalStep } from "@/components/steps/user-registration-professional-step"

describe("UserRegistrationPage", () => {
  it("renders the official registration flow and removes the generic-account UI", () => {
    const html = renderToStaticMarkup(<UserRegistrationPage />)

    expect(html).toContain("Crie seu cadastro oficial na plataforma.")
    expect(html).toContain("Dados pessoais")
    expect(html).toContain("Experiencia profissional")
    expect(html).toContain("Preferencias")
    expect(html).toContain("CV")
    expect(html).toContain('href="/jobs/list"')
    expect(html).not.toContain("Simular erro de criacao")
    expect(html).not.toContain("Criar usuario fake")
  })

  it("starts with navigation blocked while required fields are empty in each step", () => {
    const personalHtml = renderToStaticMarkup(
      <UserRegistrationPersonalStep data={{}} onUpdate={() => {}} onNext={() => {}} />,
    )
    const professionalHtml = renderToStaticMarkup(
      <UserRegistrationProfessionalStep data={{}} onUpdate={() => {}} onNext={() => {}} onBack={() => {}} />,
    )
    const preferencesHtml = renderToStaticMarkup(
      <UserRegistrationPreferencesStep data={{}} onUpdate={() => {}} onNext={() => {}} onBack={() => {}} />,
    )

    expect(personalHtml).toContain("Continuar")
    expect(personalHtml).toContain("disabled")
    expect(professionalHtml).toContain("Continuar")
    expect(professionalHtml).toContain("disabled")
    expect(preferencesHtml).toContain("Continuar")
    expect(preferencesHtml).toContain("disabled")
    expect(preferencesHtml).toContain("Ferramentas")
    expect(preferencesHtml).toContain("Viagem de trabalho")
    expect(preferencesHtml).toContain("Pretensao salarial")
    expect(preferencesHtml).toContain("Conte um pouco sobre você")
    expect(preferencesHtml).toContain("Mensagem para empresa/gestor")
    expect(preferencesHtml).toContain("Selecione ate 3 industrias")
  })
})
