import { describe, expect, it, vi } from "vitest"

import {
  buildJobPayload,
  validateJobFormState,
  type JobFormState,
} from "@/app/jobs/create/page"
import { topSectorOptions } from "@/lib/onboarding-options"

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
    time: "Produto",
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
      time: "Produto",
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
})
