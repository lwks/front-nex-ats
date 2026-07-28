import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ApplicationBoard, type Application } from "@/components/application-board"

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
          },
        },
      }),
    )

    expect(html).toContain("Nota atualizada apos salvar.")
    expect(html).not.toContain("Avancar para entrevista com lideranca.")
  })
})
