"use client"

import Link from "next/link"
import type { ComponentType } from "react"
import { useEffect, useMemo, useState } from "react"
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react"

import { AtsSidebar, BLOCKED_MODULE_LABELS } from "@/components/ats-sidebar"
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
  region?: string
  state?: string
  technicalSkills: string[]
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

export const JOBS_PER_PAGE = 6
export { BLOCKED_MODULE_LABELS }

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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function filterJobs(jobs: JobCard[], query: string) {
  const normalizedQuery = normalizeSearchText(query.trim())

  if (!normalizedQuery) {
    return jobs
  }

  return jobs.filter((job) => {
    const searchableText = normalizeSearchText(
      [
        job.title,
        job.description,
        job.company,
        job.location,
        job.region,
        job.state,
        job.workType,
        ...job.technicalSkills,
      ]
        .filter(Boolean)
        .join(" "),
    )

    return searchableText.includes(normalizedQuery)
  })
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

export function getCandidateTotalForJobs(jobs: JobCard[], byJobId: Record<string, number>) {
  return jobs.reduce((total, job) => total + (byJobId[job.id] ?? 0), 0)
}

export function JobListingsClient({ jobs, error, showEmptyState = false }: JobListingsClientProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalJob, setModalJob] = useState<JobCard | null>(null)
  const [candidateCounts, setCandidateCounts] = useState<CandidateCountState>({
    totalCandidates: 0,
    byJobId: {},
    status: "idle",
  })

  const filteredJobs = useMemo(() => filterJobs(jobs, searchQuery), [jobs, searchQuery])
  const pageCount = getPageCount(filteredJobs.length)
  const visibleJobs = useMemo(
    () => getPaginatedJobs(filteredJobs, currentPage),
    [filteredJobs, currentPage],
  )
  const filteredCandidateTotal = useMemo(
    () => getCandidateTotalForJobs(filteredJobs, candidateCounts.byJobId),
    [filteredJobs, candidateCounts.byJobId],
  )
  const jobGuidSignature = jobs
    .map((job) => job.jobGuid?.trim())
    .filter(Boolean)
    .join("|")

  useEffect(() => {
    setCurrentPage(1)
  }, [jobs, searchQuery])

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

  const handleSearchInput: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setSearchQuery(event.currentTarget.value)
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      <AtsSidebar activeItem="ats" />

      <main className="min-w-0 flex-1">
        <header className="border-b border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">ATS</p>
              <h2 className="mt-1 text-2xl font-semibold text-black">Sistema ATS</h2>
              <p className="mt-1 text-sm text-gray-600">Rastreamento de vagas e candidaturas.</p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Candidatos"
              value={filteredCandidateTotal}
              helper={
                candidateCounts.status === "loading"
                  ? "Atualizando contagem..."
                  : candidateCounts.status === "error"
                    ? "Contagem indisponivel"
                    : searchQuery.trim()
                      ? "Candidatos nas vagas filtradas"
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
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onInput={handleSearchInput}
                  placeholder="Buscar por vaga ou descricao..."
                  className="w-full rounded-lg border-2 border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100"
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
            {searchQuery.trim() ? (
              <p className="mt-3 text-sm font-medium text-gray-600">
                {filteredJobs.length} vaga{filteredJobs.length === 1 ? "" : "s"} encontrada{filteredJobs.length === 1 ? "" : "s"}.
              </p>
            ) : null}
          </section>

          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
              Nenhuma vaga disponivel no momento. Volte em breve para conferir novas oportunidades.
            </div>
          ) : null}

          {jobs.length > 0 && filteredJobs.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
              Nenhuma vaga encontrada para a busca informada.
            </div>
          ) : null}

          {filteredJobs.length > 0 ? (
            <section className="space-y-4">
              <div className="grid gap-6">
                {visibleJobs.map((job) => {
                  const candidateCount = candidateCounts.byJobId[job.id] ?? 0
                  return (
                    <article
                      key={job.id}
                      className="flex min-h-[360px] flex-col rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#FF6B00]">{job.company}</p>
                          <h3 className="mt-1 text-2xl font-semibold text-black">{job.title}</h3>
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-4" />
                              {job.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="size-4" />
                              {job.workType}
                            </span>
                          </div>
                        </div>
                        <span className="w-fit rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                          Aberta
                        </span>
                      </div>

                      <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <h4 className="font-semibold text-black">Descricao da vaga</h4>
                          <span className="w-fit rounded bg-[#FF6B00] px-2 py-1 text-xs font-semibold text-white">
                            {candidateCounts.status === "error" ? "N/D" : candidateCount} candidatos
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Regiao / Estado</p>
                            <p className="mt-1 font-medium text-gray-700">
                              {[job.region, job.state].filter(Boolean).join(" / ") || job.location}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skills tecnicas</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(job.technicalSkills.length > 0 ? job.technicalSkills : ["Nao informado"]).map((skill) => (
                                <span key={skill} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600">
                          {job.description}
                        </p>
                      </div>

                      <div className="mt-auto flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setModalJob(job)}>
                          Ver detalhes
                        </Button>
                      </div>
                    </article>
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
                    Pagina {currentPage} de {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pageCount}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    Proxima
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
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
