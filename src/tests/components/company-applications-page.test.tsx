import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  COMPANY_APPLICATIONS_PAGE_SIZE,
  CompanyApplicationsView,
  deriveCompanyApplicationsState,
  type CompanyApplicationsJob,
} from "@/components/company-applications-page"

function createJob(id: string, title = `Vaga ${id}`): CompanyApplicationsJob {
  return {
    id,
    jobGuid: `${id}-guid`,
    title,
    company: "ClusterHR",
    location: "Sao Paulo/SP",
    region: "Sudeste",
    state: "SP",
    technicalSkills: ["Python", "SQL"],
    workType: "CLT",
    description: "Descricao da vaga",
    applyHref: `/candidaturas?vagaGuid=${id}-guid`,
    isExternal: false,
    companyDetails: {},
    team: "Produto",
    createdBy: "Recruiter 1",
    createdAt: "2026-07-29",
    salaryRange: "A combinar",
    reportUrl: "https://report.example.com",
  }
}

describe("CompanyApplicationsView", () => {
  it("renders the ATS shell with search and metrics", () => {
    const jobs = [createJob("job-1", "Pessoa Desenvolvedora"), createJob("job-2", "Analista de Dados")]

    const html = renderToStaticMarkup(
      createElement(CompanyApplicationsView, {
        jobs,
        filteredJobs: jobs,
        visibleJobs: jobs,
        searchQuery: "",
        selectedJobGuid: jobs[0].jobGuid ?? "",
        currentPage: 1,
        pageCount: 1,
        currentJob: jobs[0],
        filteredCandidateTotal: 7,
        candidateCounts: {
          totalCandidates: 7,
          byJobId: {
            "job-1": 4,
            "job-2": 3,
          },
          status: "ready",
        },
        isLoadingJobs: false,
        jobsError: null,
        onSearchChange: vi.fn(),
        onJobSelect: vi.fn(),
        onPageChange: vi.fn(),
        board: <div>Board carregado</div>,
      }),
    )

    expect(html).toContain("Pipeline de candidaturas")
    expect(html).toContain("Buscar vagas")
    expect(html).toContain("Candidatos")
    expect(html).toContain("Vagas abertas")
    expect(html).toContain("Pessoa Desenvolvedora")
    expect(html).toContain("Time:")
    expect(html).toContain("Criado por:")
    expect(html).toContain("Data:")
    expect(html).toContain("Salario:")
    expect(html).toContain("Relatorio:")
    expect(html).not.toContain("Detalhes da vaga")
    expect(html).toContain('href="/"')
    expect(html).toContain("Board carregado")
  })

  it("renders empty and error states", () => {
    const errorHtml = renderToStaticMarkup(
      <CompanyApplicationsView
        jobs={[]}
        filteredJobs={[]}
        visibleJobs={[]}
        searchQuery=""
        selectedJobGuid=""
        currentPage={1}
        pageCount={1}
        currentJob={null}
        filteredCandidateTotal={0}
        candidateCounts={{ totalCandidates: 0, byJobId: {}, status: "error" }}
        isLoadingJobs={false}
        jobsError="Falha ao carregar vagas."
        onSearchChange={vi.fn()}
        onJobSelect={vi.fn()}
        onPageChange={vi.fn()}
      />,
    )

    const emptyHtml = renderToStaticMarkup(
      <CompanyApplicationsView
        jobs={[]}
        filteredJobs={[]}
        visibleJobs={[]}
        searchQuery=""
        selectedJobGuid=""
        currentPage={1}
        pageCount={1}
        currentJob={null}
        filteredCandidateTotal={0}
        candidateCounts={{ totalCandidates: 0, byJobId: {}, status: "idle" }}
        isLoadingJobs={false}
        jobsError={null}
        onSearchChange={vi.fn()}
        onJobSelect={vi.fn()}
        onPageChange={vi.fn()}
      />,
    )

    const noResultsHtml = renderToStaticMarkup(
      <CompanyApplicationsView
        jobs={[createJob("job-1")]}
        filteredJobs={[]}
        visibleJobs={[]}
        searchQuery="inexistente"
        selectedJobGuid=""
        currentPage={1}
        pageCount={1}
        currentJob={null}
        filteredCandidateTotal={0}
        candidateCounts={{ totalCandidates: 0, byJobId: {}, status: "ready" }}
        isLoadingJobs={false}
        jobsError={null}
        onSearchChange={vi.fn()}
        onJobSelect={vi.fn()}
        onPageChange={vi.fn()}
      />,
    )

    expect(errorHtml).toContain("Falha ao carregar vagas.")
    expect(emptyHtml).toContain("Nenhuma vaga disponivel no momento para acompanhar candidaturas.")
    expect(noResultsHtml).toContain("Nenhuma vaga encontrada para a busca informada.")
  })
})

describe("deriveCompanyApplicationsState", () => {
  it("selects the first available job by default and sums only filtered candidates", () => {
    const jobs = [
      createJob("job-1", "Pessoa Desenvolvedora"),
      createJob("job-2", "Analista de Dados"),
      createJob("job-3", "UX Designer"),
    ]

    const state = deriveCompanyApplicationsState(
      jobs,
      "dados",
      "",
      {
        "job-1": 5,
        "job-2": 2,
        "job-3": 8,
      },
      1,
    )

    expect(state.filteredJobs.map((job) => job.id)).toEqual(["job-2"])
    expect(state.filteredCandidateTotal).toBe(2)
    expect(state.resolvedSelectedJobGuid).toBe("job-2-guid")
  })

  it("reselects the first filtered job when the current selection leaves the search result", () => {
    const jobs = [
      createJob("job-1", "Pessoa Desenvolvedora"),
      createJob("job-2", "Analista de Dados"),
    ]

    const state = deriveCompanyApplicationsState(
      jobs,
      "dados",
      "job-1-guid",
      {
        "job-1": 5,
        "job-2": 2,
      },
      1,
    )

    expect(state.filteredJobs.map((job) => job.id)).toEqual(["job-2"])
    expect(state.resolvedSelectedJobGuid).toBe("job-2-guid")
  })

  it("paginates filtered jobs in groups of five", () => {
    const jobs = Array.from({ length: COMPANY_APPLICATIONS_PAGE_SIZE + 2 }, (_, index) =>
      createJob(`job-${index + 1}`, `Vaga ${index + 1}`),
    )

    const state = deriveCompanyApplicationsState(
      jobs,
      "",
      "",
      Object.fromEntries(jobs.map((job) => [job.id, 1])),
      2,
    )

    expect(state.pageCount).toBe(2)
    expect(state.resolvedCurrentPage).toBe(2)
    expect(state.visibleJobs.map((job) => job.id)).toEqual(["job-6", "job-7"])
    expect(state.resolvedSelectedJobGuid).toBe("job-1-guid")
  })
})
