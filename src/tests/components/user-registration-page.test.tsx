import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ProgressIndicator } from "@/components/progress-indicator"
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
    expect(personalHtml).not.toContain("Empresa Atual")
    expect(personalHtml).not.toContain("Cargo Atual")
    expect(personalHtml).not.toContain("Senioridade")
    expect(personalHtml).not.toContain("Beneficios")
    expect(professionalHtml).toContain("Empresa Atual")
    expect(professionalHtml).toContain("Cargo Atual")
    expect(professionalHtml).toContain("Senioridade")
    expect(professionalHtml).toContain("Beneficios")
    expect(professionalHtml).toContain("Cargo")
    expect(professionalHtml).toContain("Area")
    expect(professionalHtml).toContain("Hard Skills")
    expect(professionalHtml).toContain("Soft Skills")
    expect(professionalHtml).toContain("Ferramentas")
    expect(professionalHtml).toContain("Selecione um cargo para liberar as areas")
    expect(professionalHtml).toContain("Adicionar idioma")
    expect(preferencesHtml).toContain("Hard Skills")
    expect(preferencesHtml).toContain("Soft Skills")
    expect(preferencesHtml).toContain("Ferramentas")
    expect(preferencesHtml).toContain("Viagem de trabalho")
    expect(preferencesHtml).toContain("Pretensao salarial")
    expect(preferencesHtml).toContain("Conte um pouco sobre você")
    expect(preferencesHtml).toContain("Mensagem para empresa/gestor")
  })

  it("renders visited steps as clickable buttons and future steps as disabled", () => {
    const html = renderToStaticMarkup(
      <ProgressIndicator
        currentStep={2}
        totalSteps={4}
        visitedSteps={[1, 2]}
        steps={[
          { number: 1, label: "Dados pessoais" },
          { number: 2, label: "Experiencia profissional" },
          { number: 3, label: "Preferencias" },
          { number: 4, label: "CV" },
        ]}
      />,
    )

    expect(html).toContain('aria-current="step"')
    expect(html).toContain(">1</button>")
    expect(html).toContain(">2</button>")
    expect(html).toContain('disabled=""')
  })
})
