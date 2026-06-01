"use client"

import { useEffect, useMemo, useState } from "react"
import { Briefcase, PieChart, RefreshCw, Users } from "lucide-react"

import { AtsSidebar } from "@/components/ats-sidebar"
import { buildAtsReportMetrics, type AtsReportMetrics, type ReportSlice } from "@/lib/ats-report"
import { fetchCompanyReportData } from "@/services/company-report-service"

type CompanyReportState = {
  jobs: Awaited<ReturnType<typeof fetchCompanyReportData>>["jobs"]
  candidates: Awaited<ReturnType<typeof fetchCompanyReportData>>["candidates"]
  status: "idle" | "loading" | "ready" | "error"
  error: string | null
}

export type CompanyReportViewProps = {
  metrics: AtsReportMetrics
  jobOptions: Array<{ jobGuid: string; title: string }>
  selectedJobGuid: string
  isLoading: boolean
  error: string | null
  onJobChange: (jobGuid: string) => void
}

function formatSliceTotal(data: ReportSlice[]) {
  return data.reduce((total, slice) => total + slice.value, 0)
}

function polarToCartesian(center: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  }
}

function createPiePath(center: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(center, radius, endAngle)
  const end = polarToCartesian(center, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ")
}

function PieChartGraphic({ data, title }: { data: ReportSlice[]; title: string }) {
  const total = formatSliceTotal(data)
  const size = 220
  const center = size / 2
  const radius = 82

  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Sem dados para {title.toLowerCase()}.
      </div>
    )
  }

  let currentAngle = 0

  return (
    <div className="grid gap-5 xl:grid-cols-[220px_1fr] xl:items-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[220px] w-[220px]" role="img" aria-label={title}>
        {data.map((slice) => {
          const angle = (slice.value / total) * 360
          const path = createPiePath(center, radius, currentAngle, currentAngle + angle)
          const segment = (
            <path
              key={slice.label}
              d={path}
              fill={slice.color}
              stroke="#ffffff"
              strokeWidth="3"
            />
          )
          currentAngle += angle
          return segment
        })}
        <circle cx={center} cy={center} r="44" fill="#ffffff" />
        <text x={center} y={center - 4} textAnchor="middle" className="fill-slate-900 text-[18px] font-semibold">
          {total}
        </text>
        <text x={center} y={center + 18} textAnchor="middle" className="fill-slate-500 text-[11px]">
          total
        </text>
      </svg>

      <div className="space-y-3">
        {data.map((slice) => {
          const percentage = total > 0 ? Math.round((slice.value / total) * 100) : 0
          return (
            <div key={slice.label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{slice.label}</p>
                  <p className="text-xs text-slate-500">{percentage}% do total</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-slate-700">{slice.value}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ReportKpiCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Briefcase
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FF6B00]">
        <Icon className="size-5" />
      </div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
    </div>
  )
}

function ReportChartCard({
  title,
  description,
  data,
}: {
  title: string
  description: string
  data: ReportSlice[]
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{title}</p>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
      <PieChartGraphic data={data} title={title} />
    </section>
  )
}

export function CompanyReportView({
  metrics,
  jobOptions,
  selectedJobGuid,
  isLoading,
  error,
  onJobChange,
}: CompanyReportViewProps) {
  const isEmpty = !isLoading && !error && jobOptions.length === 0

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <AtsSidebar activeItem="relatorio" />

      <main className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white px-6 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#FF6B00]">ATS • Relatorio</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Indicadores operacionais</h1>
              <p className="mt-2 text-sm text-slate-500">
                Acompanhe o volume de vagas, candidatos e distribuicao do pipeline.
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2">
              <label htmlFor="report-job-select" className="text-sm font-semibold text-slate-700">
                Filtrar por vaga
              </label>
              <select
                id="report-job-select"
                value={selectedJobGuid}
                onChange={(event) => onJobChange(event.currentTarget.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                disabled={isLoading || jobOptions.length === 0}
              >
                <option value="">Todas as vagas</option>
                {jobOptions.map((job) => (
                  <option key={job.jobGuid} value={job.jobGuid}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6">
          {isLoading ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              <RefreshCw className="mx-auto mb-3 size-5 animate-spin text-[#FF6B00]" />
              Carregando relatorio...
            </section>
          ) : null}

          {error ? (
            <section className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
              {error}
            </section>
          ) : null}

          {isEmpty ? (
            <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Nenhuma vaga disponivel para gerar o relatorio.
            </section>
          ) : null}

          {!isLoading && !error && !isEmpty ? (
            <>
              <section className="grid gap-4 md:grid-cols-2">
                <ReportKpiCard
                  icon={Briefcase}
                  label="Quantidade de vagas abertas"
                  value={metrics.totalOpenJobs}
                  helper={metrics.selectedJobTitle ? `Filtro ativo: ${metrics.selectedJobTitle}` : "Visao consolidada da empresa"}
                />
                <ReportKpiCard
                  icon={Users}
                  label="Quantidade total de candidatos"
                  value={metrics.totalCandidates}
                  helper="Candidatos mapeados nas vagas analisadas"
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <ReportChartCard
                  title="Candidatos por vaga"
                  description="Distribuicao dos candidatos entre as vagas selecionadas."
                  data={metrics.candidatesPerJob}
                />
                <ReportChartCard
                  title="Candidatos por etapa"
                  description="Distribuicao do pipeline com base no status normalizado das candidaturas."
                  data={metrics.candidatesByStage}
                />
              </section>

              <ReportChartCard
                title="Cobertura das vagas"
                description="Comparativo entre vagas com candidatos associados e vagas ainda sem candidaturas."
                data={metrics.jobsCoverage}
              />
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export function CompanyReportPage() {
  const [selectedJobGuid, setSelectedJobGuid] = useState("")
  const [state, setState] = useState<CompanyReportState>({
    jobs: [],
    candidates: [],
    status: "idle",
    error: null,
  })

  useEffect(() => {
    let active = true

    async function loadReport() {
      setState((previous) => ({ ...previous, status: "loading", error: null }))

      try {
        const reportData = await fetchCompanyReportData()
        if (!active) {
          return
        }

        setState({
          ...reportData,
          status: "ready",
          error: null,
        })
      } catch (error) {
        if (!active) {
          return
        }

        setState({
          jobs: [],
          candidates: [],
          status: "error",
          error: error instanceof Error ? error.message : "Nao foi possivel carregar o relatorio no momento.",
        })
      }
    }

    loadReport()

    return () => {
      active = false
    }
  }, [])

  const jobOptions = useMemo(
    () => state.jobs.map((job) => ({ jobGuid: job.jobGuid, title: job.title })),
    [state.jobs],
  )
  const metrics = useMemo(
    () => buildAtsReportMetrics(state.jobs, state.candidates, selectedJobGuid),
    [selectedJobGuid, state.candidates, state.jobs],
  )

  return (
    <CompanyReportView
      metrics={metrics}
      jobOptions={jobOptions}
      selectedJobGuid={selectedJobGuid}
      isLoading={state.status === "loading" || state.status === "idle"}
      error={state.error}
      onJobChange={setSelectedJobGuid}
    />
  )
}
