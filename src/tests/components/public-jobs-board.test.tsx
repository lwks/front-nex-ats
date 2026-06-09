import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  hasInitialPublicJobs,
  PublicJobDetailsModal,
  PublicJobsBoardView,
  type PublicJobsBoardViewProps,
} from "@/components/public-jobs-board"
import type { JobBoardJob } from "@/lib/job-board"

function createJob(id: string, guid = `${id}-guid`): JobBoardJob {
  return {
    id,
    guid,
    title: `Vaga ${id}`,
    company: "ClusterHR",
    location: "São Paulo/SP",
    workType: "Remoto",
    contractType: "CLT",
    salary: "R$ 10.000 - R$ 12.000",
    description: "Descrição detalhada da vaga.",
    skills: ["React", "TypeScript"],
    benefits: ["VR", "Plano de saúde"],
    requirements: ["Experiência com React"],
    responsibilities: ["Entregar novas features"],
    applyHref: `/candidaturas?vagaGuid=${guid}`,
  }
}

function createViewProps(overrides: Partial<PublicJobsBoardViewProps> = {}): PublicJobsBoardViewProps {
  return {
    jobs: [createJob("job-1"), createJob("job-2")],
    query: "",
    onQueryChange: vi.fn(),
    selectedJob: null,
    onOpenJob: vi.fn(),
    onCloseJob: vi.fn(),
    onLoadMore: vi.fn(),
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    ...overrides,
  }
}

describe("PublicJobsBoardView", () => {
  it("detects when the page already has initial jobs and should skip bootstrap fetch", () => {
    expect(hasInitialPublicJobs()).toBe(false)
    expect(hasInitialPublicJobs([])).toBe(false)
    expect(hasInitialPublicJobs([createJob("job-1")])).toBe(true)
  })

  it("renders the hero and the job list", () => {
    const html = renderToStaticMarkup(<PublicJobsBoardView {...createViewProps()} />)

    expect(html).toContain("Encontre sua próxima oportunidade com a ClusterHR.")
    expect(html).toContain("Vaga job-1")
    expect(html).toContain("Vaga job-2")
    expect(html).not.toContain("Criar perfil para candidatar")
    expect(html).not.toContain("Iniciar candidatura")
    expect(html).not.toContain("Publicar nova vaga")
    expect(html).toContain("Carregar mais vagas")
  })

  it("renders the empty search state when no job matches the query", () => {
    const html = renderToStaticMarkup(
      <PublicJobsBoardView {...createViewProps({ query: "inexistente" })} />,
    )

    expect(html).toContain("Nenhum resultado para essa busca")
  })

  it("renders error and empty states", () => {
    const errorHtml = renderToStaticMarkup(
      <PublicJobsBoardView {...createViewProps({ error: "Falha ao carregar vagas." })} />,
    )
    const emptyHtml = renderToStaticMarkup(
      <PublicJobsBoardView {...createViewProps({ jobs: [], hasMore: false })} />,
    )

    expect(errorHtml).toContain("Falha ao carregar vagas.")
    expect(emptyHtml).toContain("Nenhuma vaga disponível no momento")
  })
})

describe("PublicJobDetailsModal", () => {
  it("renders the modal CTA pointing to the candidatura route", () => {
    const html = renderToStaticMarkup(
      <PublicJobDetailsModal job={createJob("job-1", "guid-1")} onClose={vi.fn()} />,
    )

    expect(html).toContain("Candidatar-se agora")
    expect(html).toContain('href="/candidaturas?vagaGuid=guid-1"')
    expect(html).toContain("Responsabilidades")
    expect(html).toContain("Requisitos")
    expect(html).toContain("Benefícios")
  })

  it("hides empty optional sections", () => {
    const html = renderToStaticMarkup(
      <PublicJobDetailsModal
        job={{
          ...createJob("job-2", "guid-2"),
          benefits: [],
          requirements: [],
          responsibilities: [],
        }}
        onClose={vi.fn()}
      />,
    )

    expect(html).not.toContain("Responsabilidades")
    expect(html).not.toContain("Requisitos")
    expect(html).not.toContain("Benefícios")
  })
})
