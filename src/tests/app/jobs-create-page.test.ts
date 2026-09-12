import { describe, expect, it, vi } from "vitest"

import {
  buildJobPayload,
  validateJobFormState,
  type JobFormState,
} from "@/app/jobs/create/page"
import { defaultTeamOptions, normalizeTeamValue, topSectorOptions } from "@/lib/onboarding-options"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

function createValidFormState(overrides: Partial<JobFormState> = {}): JobFormState {
  return {
    titulo: "Desenvolvedor Front-end",
    descricao: "Responsavel por desenvolver interfaces web com qualidade e colaboracao.",
    cargo: "desenvolvedor-front-end",
    nivel: "sr",
    setor: "Tecnologia",
  area: ["3", "12"],
    time: "Desenvolvimento Front-end",
    localizacao: "01001000",
    cidade: "Sao Paulo",
    estado: "SP",
    modelo_trabalho: "hibrido",
    formato_contratacao: "clt",
    skills: "React, TypeScript\nTailwind",
    beneficios: "VR, Plano de saude",
    valor_inicial: "8.000",
    valor_final: "12.000",
    exibir_salario: true,
    ...overrides,
  }
}

describe("/jobs/create payload helpers", () => {
  it("builds the create-job payload with setor, area and time", () => {
    const payload = buildJobPayload(createValidFormState(), "job-guid-1", "2026-07-23")

    expect(payload).toMatchObject({
      titulo: "Desenvolvedor Front-end",
      cargo: "desenvolvedor-front-end",
      nivel: "sr",
      setor: "Tecnologia",
      area: [3, 12],
      time: "Desenvolvimento Front-end",
      guid_id: "job-guid-1",
      publicada_em: "2026-07-23",
      status: "Aberto",
      skills: ["React", "TypeScript", "Tailwind"],
      beneficios: ["VR", "Plano de saude"],
      orcamento: {
        valor_inicial: 8000,
        valor_final: 12000,
      },
    })
  })

  it("requires setor, area and time before creating the payload", () => {
    expect(() => validateJobFormState(createValidFormState({ setor: "" }))).toThrow("Informe o setor.")
    expect(() => validateJobFormState(createValidFormState({ area: [] }))).toThrow("Selecione ao menos uma area.")
    expect(() => validateJobFormState(createValidFormState({ time: "" }))).toThrow("Informe o time.")
  })

  it("enforces the same area selection limit used by the registration flow", () => {
    expect(() =>
      validateJobFormState(
        createValidFormState({
          area: ["3", "12", "1", "4"],
        }),
      ),
    ).toThrow("Selecione no maximo 3 areas.")
  })

  it("keeps setor as a fixed dropdown with 15 predefined options", () => {
    expect(topSectorOptions).toHaveLength(15)
    expect(topSectorOptions.map((option) => option.value)).toContain("tecnologia-informacao-ti")
    expect(topSectorOptions.map((option) => option.value)).toContain("agronegocio")
  })

  it("provides the 39 team options in alphabetical order with matching values and labels", () => {
    expect(defaultTeamOptions).toHaveLength(39)
    expect(defaultTeamOptions.every((option) => option.value === option.label)).toBe(true)
    expect(defaultTeamOptions.map((option) => option.label)).toEqual([
      "Análise de Dados",
      "Arquitetura de Dados",
      "Arquitetura de Software",
      "Auditoria",
      "Business Intelligence (BI)",
      "Business Partner",
      "Ciência de Dados",
      "Cloud Engineering",
      "Compras/Procurement",
      "Contabilidade",
      "Contas a Pagar/Contas a Receber",
      "Controladoria",
      "Crédito e Risco",
      "Departamento Pessoal",
      "Desenvolvimento Back-end",
      "Desenvolvimento Front-end",
      "Desenvolvimento Full Stack",
      "DevOps",
      "Employer Branding",
      "Engenharia de Dados",
      "Engenharia de IA",
      "Engenharia de Software",
      "FP&A (Planejamento Financeiro)",
      "Help Desk",
      "HR Operations",
      "Infraestrutura de TI",
      "Investimentos",
      "Machine Learning",
      "People Analytics",
      "Quality Assurance (QA)",
      "Redes",
      "Remuneração e Beneficios",
      "Segurança da Informação",
      "Site Reliability Engineering (SRE)",
      "Talent Acquisition",
      "Tesouraria",
      "Treinamento e Desenvolvimento",
      "UI Design",
      "UX Design",
    ])
  })

  it("clears a legacy team value that is not in the fixed options", () => {
    expect(normalizeTeamValue("Produto")).toBe("")
    expect(normalizeTeamValue(" Desenvolvimento Front-end ")).toBe("Desenvolvimento Front-end")
  })
})
