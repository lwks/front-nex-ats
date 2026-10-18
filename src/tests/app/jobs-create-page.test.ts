import { describe, expect, it, vi } from "vitest"

import {
  buildJobPayload,
  MAX_JOB_SKILL_SELECTIONS,
  validateJobFormState,
  type JobFormState,
} from "@/app/jobs/create/page"
import {
  defaultTeamOptions,
  MAX_AREA_SELECTIONS,
  MAX_PREFERENCE_SECTOR_SELECTIONS,
  MAX_PREFERENCE_SENIORITY_SELECTIONS,
  MAX_TEAM_SELECTIONS,
  topSectorOptions,
} from "@/lib/onboarding-options"

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))

function createValidFormState(overrides: Partial<JobFormState> = {}): JobFormState {
  return {
    titulo: "Desenvolvedor Front-end",
    descricao: "Responsavel por desenvolver interfaces web com qualidade e colaboracao.",
    area: ["3"],
    time: ["Desenvolvimento Front-end"],
    senioridade: ["pleno", "senior"],
    setor: ["tecnologia-informacao-ti"],
    cidade: "Sao Paulo",
    estado: "SP",
    modelo_trabalho: "hibrido",
    formato_contratacao: "clt",
    experiencia: "pleno",
    beneficios: ["vale-refeicao", "plano-saude"],
    hardSkills: ["javascript", "typescript"],
    softSkills: ["colaboracao", "comunicacao-oral"],
    valor_inicial: "8.000",
    valor_final: "12.000",
    exibir_salario: true,
    ...overrides,
  }
}

describe("/jobs/create payload helpers", () => {
  it("builds the job payload with candidate selectors and array values", () => {
    const times = ["Desenvolvimento Front-end", "Desenvolvimento Back-end", "DevOps"]
    const payload = buildJobPayload(createValidFormState({ time: times }), "job-guid-1", "2026-07-23")

    expect(payload).toMatchObject({
      titulo: "Desenvolvedor Front-end",
      area: [3],
      time: times,
      senioridade: ["pleno", "senior"],
      setor: ["tecnologia-informacao-ti"],
      experiencia: "pleno",
      skills: ["javascript", "typescript"],
      soft_skills: ["colaboracao", "comunicacao-oral"],
      beneficios: ["vale-refeicao", "plano-saude"],
      cidade: "Sao Paulo",
      estado: "SP",
      guid_id: "job-guid-1",
      publicada_em: "2026-07-23",
      status: "Aberto",
      orcamento: { valor_inicial: 8000, valor_final: 12000 },
    })
    expect(payload).not.toHaveProperty("cargo")
    expect(payload).not.toHaveProperty("nivel")
    expect(payload).not.toHaveProperty("localizacao")
  })

  it("requires all classification, profile, location and salary fields", () => {
    const valid = createValidFormState()
    const missingFields: Array<[Partial<JobFormState>, string]> = [
      [{ area: [] }, "Selecione ao menos uma area."],
      [{ time: [] }, "Selecione ao menos um time."],
      [{ senioridade: [] }, "Selecione ao menos uma senioridade."],
      [{ setor: [] }, "Selecione ao menos um setor."],
      [{ experiencia: "" }, "Selecione a experiencia profissional."],
      [{ beneficios: [] }, "Selecione ao menos um beneficio."],
      [{ hardSkills: [] }, "Selecione ao menos uma hard skill."],
      [{ softSkills: [] }, "Selecione ao menos uma soft skill."],
      [{ cidade: "" }, "Informe cidade e estado."],
    ]
    expect(valid).toBeDefined()
    for (const [override, message] of missingFields) {
      expect(() => validateJobFormState(createValidFormState(override))).toThrow(message)
    }
  })

  it("enforces the same Area, Team, Seniority and Sector limits as candidate preferences", () => {
    expect(MAX_AREA_SELECTIONS).toBe(1)
    expect(MAX_TEAM_SELECTIONS).toBe(3)
    expect(MAX_PREFERENCE_SENIORITY_SELECTIONS).toBe(3)
    expect(MAX_PREFERENCE_SECTOR_SELECTIONS).toBe(5)
    expect(() => validateJobFormState(createValidFormState({ area: ["3", "12"] }))).toThrow("no maximo 1 area")
    expect(() => validateJobFormState(createValidFormState({ time: ["1", "2", "3", "4"] }))).toThrow("no maximo 3 times")
    expect(() => validateJobFormState(createValidFormState({ senioridade: ["1", "2", "3", "4"] }))).toThrow("no maximo 3 senioridades")
    expect(() => validateJobFormState(createValidFormState({ setor: ["1", "2", "3", "4", "5", "6"] }))).toThrow("no maximo 5 setores")
  })

  it("limits job hard and soft skills to seven", () => {
    expect(MAX_JOB_SKILL_SELECTIONS).toBe(7)
    const eight = Array.from({ length: 8 }, (_, index) => `skill-${index}`)
    expect(() => validateJobFormState(createValidFormState({ hardSkills: eight }))).toThrow("no maximo 7 hard skills")
    expect(() => validateJobFormState(createValidFormState({ softSkills: eight }))).toThrow("no maximo 7 soft skills")
  })

  it("keeps sector and team catalogs from the candidate onboarding", () => {
    expect(topSectorOptions).toHaveLength(15)
    expect(topSectorOptions.map((option) => option.value)).toContain("tecnologia-informacao-ti")
    expect(defaultTeamOptions).toHaveLength(53)
    expect(defaultTeamOptions.every((option) => option.value === option.label)).toBe(true)
  })

  it("rejects an invalid salary range", () => {
    expect(() => validateJobFormState(createValidFormState({ valor_inicial: "12.000", valor_final: "8.000" })))
      .toThrow("O valor inicial nao pode ser maior que o valor final.")
  })
})
