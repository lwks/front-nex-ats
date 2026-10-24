import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ApplicationBoard, normalizeCandidate, type Application } from "@/components/application-board"

const applications: Application[] = [
  {
    id: "candidate-1",
    recordId: "candidate-1",
    nome: "Ana Souza",
    cargo: "Product Designer",
    email: "ana@clusterhr.com",
    telefone: "11 99999-9999",
    modeloTrabalho: "Remoto",
    senioridade: "Senior",
    experiencia: "8 anos",
    skills: ["Figma", "Research", "Design System"],
    notes: "Avancar para entrevista com lideranca.",
    status: "novos",
    atualizadoEm: "2026-07-28",
  },
]

describe("ApplicationBoard", () => {
  it("normalizes the candidate fields sent by the current application form", () => {
    const candidate = normalizeCandidate({
      id: "candidate-2",
      guid_id: "candidate-2",
      nome: "Candidato Teste",
      contato: "candidate@example.com",
      contatoCel: "11999999999",
      modeloTrabalho: ["Remoto", "Hibrido"],
      hardSkills: ["TypeScript", "Playwright"],
      softSkills: ["Comunicacao"],
      status: "entrevista-rh",
    }, 0)

    expect(candidate).toMatchObject({
      email: "candidate@example.com",
      telefone: "11999999999",
      modeloTrabalho: "Remoto, Hibrido",
      skills: ["TypeScript", "Playwright", "Comunicacao"],
      status: "entrevista-rh",
    })
  })

  it("normalizes scalar preference and skill values returned by the API", () => {
    const candidate = normalizeCandidate({
      guid_id: "candidate-3",
      nome: "Candidato Teste",
      modeloTrabalho: "presencial",
      hardSkills: "logica-de-programacao",
      softSkills: "adaptabilidade",
    }, 0)

    expect(candidate).toMatchObject({
      modeloTrabalho: "presencial",
      skills: ["logica-de-programacao", "adaptabilidade"],
    })
  })

  it("renders candidate cards with recruiter note preview", () => {
    const html = renderToStaticMarkup(
      createElement(ApplicationBoard, {
        candidaturas: applications,
        draggable: false,
      }),
    )

    expect(html).toContain("Ana Souza")
    expect(html).toContain("Avancar para entrevista com lideranca.")
    expect(html).toContain("Sem candidatos nesta etapa.")
  })

  it("applies runtime overrides so saved notes remain visible", () => {
    const html = renderToStaticMarkup(
      createElement(ApplicationBoard, {
        candidaturas: applications,
        draggable: false,
        applicationOverrides: {
          "candidate-1": {
            notes: "Nota atualizada apos salvar.",
            status: "proposta",
          },
        },
      }),
    )

    expect(html).toContain("Nota atualizada apos salvar.")
    expect(html).not.toContain("Avancar para entrevista com lideranca.")
    expect(html).toContain("Proposta")
  })
})
