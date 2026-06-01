import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { CompanyReportView, type CompanyReportViewProps } from "@/components/company-report-page"
import type { AtsReportMetrics } from "@/lib/ats-report"

function createMetrics(overrides: Partial<AtsReportMetrics> = {}): AtsReportMetrics {
  return {
    totalOpenJobs: 3,
    totalCandidates: 8,
    selectedJobTitle: null,
    candidatesPerJob: [
      { label: "Pessoa Desenvolvedora", value: 5, color: "#FF6B00" },
      { label: "Analista de Dados", value: 3, color: "#2E86AB" },
    ],
    candidatesByStage: [
      { label: "Novos", value: 4, color: "#FF6B00" },
      { label: "Entrevista RH", value: 2, color: "#2E86AB" },
      { label: "Proposta", value: 2, color: "#3A86FF" },
    ],
    jobsCoverage: [
      { label: "Vagas com candidatos", value: 2, color: "#FF6B00" },
      { label: "Vagas sem candidatos", value: 1, color: "#2E86AB" },
    ],
    ...overrides,
  }
}

function createViewProps(overrides: Partial<CompanyReportViewProps> = {}): CompanyReportViewProps {
  return {
    metrics: createMetrics(),
    jobOptions: [
      { jobGuid: "guid-1", title: "Pessoa Desenvolvedora" },
      { jobGuid: "guid-2", title: "Analista de Dados" },
    ],
    selectedJobGuid: "",
    isLoading: false,
    error: null,
    onJobChange: vi.fn(),
    ...overrides,
  }
}

describe("CompanyReportView", () => {
  it("renders the report dashboard with KPIs and pie chart sections", () => {
    const html = renderToStaticMarkup(<CompanyReportView {...createViewProps()} />)

    expect(html).toContain("Indicadores operacionais")
    expect(html).toContain("Quantidade de vagas abertas")
    expect(html).toContain("Quantidade total de candidatos")
    expect(html).toContain("Candidatos por vaga")
    expect(html).toContain("Candidatos por etapa")
    expect(html).toContain("Cobertura das vagas")
    expect(html).toContain('href="/empresa/relatorio"')
  })

  it("reflects a selected job in the filter helper text", () => {
    const html = renderToStaticMarkup(
      <CompanyReportView
        {...createViewProps({
          selectedJobGuid: "guid-2",
          metrics: createMetrics({
            totalOpenJobs: 1,
            totalCandidates: 3,
            selectedJobTitle: "Analista de Dados",
            candidatesPerJob: [{ label: "Analista de Dados", value: 3, color: "#FF6B00" }],
          }),
        })}
      />,
    )

    expect(html).toContain("Filtro ativo: Analista de Dados")
    expect(html).toContain('<option value="guid-2" selected="">Analista de Dados</option>')
  })

  it("renders error and empty states", () => {
    const errorHtml = renderToStaticMarkup(
      <CompanyReportView {...createViewProps({ error: "Falha ao carregar relatorio." })} />,
    )
    const emptyHtml = renderToStaticMarkup(
      <CompanyReportView {...createViewProps({ jobOptions: [], metrics: createMetrics({ totalOpenJobs: 0, totalCandidates: 0, candidatesPerJob: [], candidatesByStage: [], jobsCoverage: [] }) })} />,
    )

    expect(errorHtml).toContain("Falha ao carregar relatorio.")
    expect(emptyHtml).toContain("Nenhuma vaga disponivel para gerar o relatorio.")
  })
})
