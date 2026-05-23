"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  GraduationCap,
  Handshake,
  LineChart,
  Lock,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react"

import { fetchCandidatesByJobGuids } from "@/services/candidates-by-job-guids-service"

import { JobDetailsModal } from "./modals/job-details-modal"
import { Button } from "./ui/button"

type CompanyDetails = {
  segment?: string
  industry?: string
  website?: string
  companyWebsite?: string
  contactEmail?: string
}

export type JobCard = {
  id: string
  jobGuid?: string
  title: string
  company: string
  location: string
  workType: string
  description: string
  applyHref: string
  isExternal: boolean
  companyDetails: CompanyDetails
}

type JobListingsClientProps = {
  jobs: JobCard[]
  error?: string
  showEmptyState?: boolean
}

type CandidateMetrics = {
  totalCandidates: number
  byJobId: Record<string, number>
}

type CandidateCountState = CandidateMetrics & {
  status: "idle" | "loading" | "ready" | "error"
}

export const JOBS_PER_PAGE = 3
export const BLOCKED_MODULE_LABELS = ["Performance", "Estudos", "Parceiros"] as const

const blockedModules = [
  { label: "Performance", description: "Análise de Desempenho", icon: LineChart },
  { label: "Estudos", description: "Central de Estudos", icon: GraduationCap },
  { label: "Parceiros", description: "Recrutamento Externo", icon: Handshake },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }

    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value)
    }
  }

  return undefined
}

function extractCandidateItems(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => isRecord(item))
  }

  if (!isRecord(payload)) {
    return []
  }

  const collectionKeys = ["items", "results", "data", "candidatos", "candidates", "content"]
  for (const key of collectionKeys) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => isRecord(item))
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value) || isRecord(value)) {
      const nested = extractCandidateItems(value)
      if (nested.length > 0) {
        return nested
      }
    }
  }

  return []
}

function getCandidateJobGuid(candidate: Record<string, unknown>) {
  return pickString(
    candidate.guid_vaga,
    candidate.vagaGuid,
    candidate.jobGuid,
    candidate.job_guid,
    candidate.id_vaga,
    candidate.vaga_id,
  )
}

export function getPageCount(totalItems: number, pageSize = JOBS_PER_PAGE) {
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export function getPaginatedJobs<T>(jobs: T[], page: number, pageSize = JOBS_PER_PAGE) {
  const safePage = Math.min(Math.max(page, 1), getPageCount(jobs.length, pageSize))
  const start = (safePage - 1) * pageSize
  return jobs.slice(start, start + pageSize)
}

export function deriveCandidateMetrics(payload: unknown, jobs: JobCard[]): CandidateMetrics {
  const candidates = extractCandidateItems(payload)
  const guidToJobId = new Map(
    jobs
      .map((job) => [job.jobGuid?.trim(), job.id] as const)
      .filter((entry): entry is [string, string] => Boolean(entry[0])),
  )
  const byJobId: Record<string, number> = {}

  for (const candidate of candidates) {
    const jobId = guidToJobId.get(getCandidateJobGuid(candidate) ?? "")
    if (jobId) {
      byJobId[jobId] = (byJobId[jobId] ?? 0) + 1
    }
  }

  return {
    totalCandidates: candidates.length,
    byJobId,
  }
}

export function JobListingsClient({ jobs, error, showEmptyState = false }: JobListingsClientProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id ?? "")
  const [modalJob, setModalJob] = useState<JobCard | null>(null)
  const [candidateCounts, setCandidateCounts] = useState<CandidateCountState>({
    totalCandidates: 0,
    byJobId: {},
    status: "idle",
  })

  const pageCount = getPageCount(jobs.length)
  const visibleJobs = useMemo(() => getPaginatedJobs(jobs, currentPage), [jobs, currentPage])
  const selectedJob =
    jobs.find((job) => job.id === selectedJobId) ?? visibleJobs[0] ?? jobs[0] ?? null
  const jobGuidSignature = jobs
    .map((job) => job.jobGuid?.trim())
    .filter(Boolean)
    .join("|")

  useEffect(() => {
    setCurrentPage(1)
    setSelectedJobId(jobs[0]?.id ?? "")
  }, [jobs])

  useEffect(() => {
    if (!visibleJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(visibleJobs[0]?.id ?? jobs[0]?.id ?? "")
    }
  }, [jobs, selectedJobId, visibleJobs])

  useEffect(() => {
    const jobGuids = jobs
      .map((job) => job.jobGuid?.trim())
      .filter((guid): guid is string => Boolean(guid))

    if (jobGuids.length === 0) {
      setCandidateCounts({ totalCandidates: 0, byJobId: {}, status: "idle" })
      return
    }

    let active = true
    setCandidateCounts((previous) => ({ ...previous, status: "loading" }))

    fetchCandidatesByJobGuids(jobGuids)
      .then((payload) => {
        if (!active) return
        setCandidateCounts({
          ...deriveCandidateMetrics(payload, jobs),
          status: "ready",
        })
      })
      .catch((fetchError) => {
        console.error("Erro ao buscar contagem de candidatos:", fetchError)
        if (!active) return
        setCandidateCounts({ totalCandidates: 0, byJobId: {}, status: "error" })
      })

    return () => {
      active = false
    }
  }, [jobs, jobGuidSignature])

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), pageCount))
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#333333] bg-[#1a1a1a] text-white transition-all duration-300 md:flex ${
          isSidebarCollapsed ? "w-20" : "w-72"
        }`}
      >
        <div className={`flex items-center justify-between border-b border-[#333333] p-5 ${isSidebarCollapsed ? "flex-col gap-4" : ""}`}>
          <div className="min-w-0">
            <h1 className={`font-semibold ${isSidebarCollapsed ? "text-center text-sm" : "text-xl"}`}>
              {isSidebarCollapsed ? "RH" : "Sistema RH"}
            </h1>
            {!isSidebarCollapsed ? (
              <p className="mt-1 text-sm text-gray-400">Gestão de Talentos</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((previous) => !previous)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#333333] text-gray-300 transition hover:border-[#FF6B00] hover:text-white"
            aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Minimizar sidebar"}
            aria-expanded={!isSidebarCollapsed}
          >
            {isSidebarCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg bg-[#FF6B00] px-4 py-3 text-left text-white shadow-lg"
          >
            <Users className="size-5 shrink-0" />
            {!isSidebarCollapsed ? (
              <span>
                <span className="block font-medium">ATS</span>
                <span className="block text-xs opacity-80">Sistema de Rastreamento</span>
              </span>
            ) : null}
          </button>

          {blockedModules.map((module) => {
            const Icon = module.icon
            return (
              <button
                key={module.label}
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-left text-gray-500 opacity-70"
                aria-disabled="true"
                title={`${module.label} bloqueado`}
              >
                <Icon className="size-5 shrink-0" />
                {!isSidebarCollapsed ? (
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{module.label}</span>
                    <span className="block text-xs">{module.description}</span>
                  </span>
                ) : null}
                {!isSidebarCollapsed ? <Lock className="size-4 shrink-0" /> : null}
              </button>
            )
          })}
        </nav>

        {!isSidebarCollapsed ? (
          <div className="border-t border-[#333333] p-4">
            <div className="rounded-lg bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] p-4 text-white shadow-xl">
              <Lock className="mb-2 size-5" />
              <p className="text-sm font-semibold">Módulos bloqueados</p>
              <p className="mt-1 text-xs opacity-90">Disponíveis em uma próxima etapa.</p>
            </div>
          </div>
        ) : null}
      </aside>

      <main className="min-w-0 flex-1">
        <header className="border-b border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">ATS</p>
              <h2 className="mt-1 text-2xl font-semibold text-black">Sistema ATS</h2>
              <p className="mt-1 text-sm text-gray-600">Rastreamento de vagas e candidaturas.</p>
            </div>
            <Button asChild className="w-full rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF8C00] sm:w-auto">
              <Link href="/jobs/create">
                <Plus className="size-4" />
                Nova Vaga
              </Link>
            </Button>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Candidatos"
              value={candidateCounts.totalCandidates}
              helper={
                candidateCounts.status === "loading"
                  ? "Atualizando contagem..."
                  : candidateCounts.status === "error"
                    ? "Contagem indisponível"
                    : "Candidatos nas vagas listadas"
              }
            />
            <MetricCard
              icon={Briefcase}
              label="Vagas abertas"
              value={jobs.length}
              helper="Oportunidades carregadas"
            />
            <Link
              href="/jobs/create"
              className="rounded-lg border-2 border-[#FF6B00] bg-orange-50 p-5 text-[#FF6B00] shadow-sm transition hover:bg-orange-100"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B00] text-white">
                <Plus className="size-5" />
              </div>
              <p className="text-2xl font-bold">Nova vaga</p>
              <p className="mt-1 text-sm font-medium">Abrir cadastro de oportunidade</p>
            </Link>
          </section>

          <section className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  disabled
                  type="text"
                  placeholder="Buscar vagas... (em breve)"
                  className="w-full cursor-not-allowed rounded-lg border-2 border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-500 outline-none"
                />
              </div>
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-500"
              >
                <Filter className="size-4" />
                Filtros
              </button>
            </div>
          </section>

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
              Nenhuma vaga disponível no momento. Volte em breve para conferir novas oportunidades.
            </div>
          ) : null}

          {jobs.length > 0 ? (
            <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="space-y-3">
                {visibleJobs.map((job) => {
                  const isSelected = selectedJob?.id === job.id
                  const candidateCount = candidateCounts.byJobId[job.id] ?? 0
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full rounded-lg border-2 bg-white p-4 text-left shadow-sm transition ${
                        isSelected
                          ? "border-[#FF6B00] bg-orange-50"
                          : "border-gray-200 hover:border-[#FF6B00] hover:shadow-md"
                      }`}
                    >
                      <h3 className="font-semibold text-black">{job.title}</h3>
                      <p className="mt-1 text-sm font-medium text-gray-600">{job.company}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="size-3" />
                        {job.location}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span className="rounded bg-[#FF6B00] px-2 py-1 text-xs font-semibold text-white">
                          {candidateCounts.status === "error" ? "N/D" : candidateCount} candidatos
                        </span>
                        <span className="text-xs font-semibold text-gray-600">{job.workType}</span>
                      </div>
                    </button>
                  )
                })}

                <div className="flex items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="size-4" />
                    Anterior
                  </Button>
                  <span className="text-sm font-semibold text-gray-700">
                    Página {currentPage} de {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pageCount}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Próxima
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {selectedJob ? (
                <article className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#FF6B00]">{selectedJob.company}</p>
                      <h3 className="mt-1 text-2xl font-semibold text-black">{selectedJob.title}</h3>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-4" />
                          {selectedJob.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="size-4" />
                          {selectedJob.workType}
                        </span>
                      </div>
                    </div>
                    <span className="w-fit rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      Aberta
                    </span>
                  </div>

                  <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
                    <h4 className="font-semibold text-black">Descrição da vaga</h4>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                      {selectedJob.description}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" onClick={() => setModalJob(selectedJob)}>
                      Ver detalhes
                    </Button>
                    <Button asChild className="rounded-lg bg-[#FF6B00] text-white hover:bg-[#FF8C00]">
                      <Link
                        href={selectedJob.applyHref}
                        {...(selectedJob.isExternal
                          ? {
                            target: "_blank",
                            rel: "noopener noreferrer",
                          }
                          : undefined)}
                      >
                        Candidatar-se
                      </Link>
                    </Button>
                  </div>
                </article>
              ) : null}
            </section>
          ) : null}
        </div>
      </main>

      <JobDetailsModal job={modalJob} onClose={() => setModalJob(null)} />
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number
  helper: string
}) {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[#FF6B00]">
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-bold text-black">{value}</p>
      <p className="mt-1 text-sm font-semibold text-gray-700">{label}</p>
      <p className="mt-1 text-xs text-gray-500">{helper}</p>
    </div>
  )
}
