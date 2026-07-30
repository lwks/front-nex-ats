"use client"

import type { ChangeEventHandler, ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { Briefcase, ChevronLeft, ChevronRight, MapPin, Search, Users } from "lucide-react"

import {
  type Application,
  ApplicationBoardFromApi,
  type ApplicationColumn,
} from "@/components/application-board"
import { AtsSidebar } from "@/components/ats-sidebar"
import { JOBS_API_URL } from "@/config"
import {
  type JobCard,
  deriveCandidateMetrics,
  filterJobs,
  getCandidateTotalForJobs,
  getPageCount,
  getPaginatedJobs,
} from "@/components/job-listings-client"
import { updateCandidateNotes } from "@/services/candidate-notes-service"
import { fetchCandidatesByJobGuids } from "@/services/candidates-by-job-guids-service"

type ApiJob = Record<string, unknown>

type CandidateCountState = {
  totalCandidates: number
  byJobId: Record<string, number>
  status: "idle" | "loading" | "ready" | "error"
}

export type CompanyApplicationsJob = JobCard & {
  team: string
  createdBy: string
  createdAt: string
  salaryRange: string
  reportUrl: string
}

export type CompanyApplicationsViewProps = {
  jobs: CompanyApplicationsJob[]
  filteredJobs: CompanyApplicationsJob[]
  visibleJobs: CompanyApplicationsJob[]
  searchQuery: string
  selectedJobGuid: string
  currentPage: number
  pageCount: number
  currentJob: CompanyApplicationsJob | null
  filteredCandidateTotal: number
  candidateCounts: CandidateCountState
  isLoadingJobs: boolean
  jobsError: string | null
  onSearchChange: ChangeEventHandler<HTMLInputElement>
  onJobSelect: (jobGuid: string) => void
  onPageChange: (page: number) => void
  onOpenJobDetails: () => void
  board?: ReactNode
}

export const COMPANY_APPLICATIONS_PAGE_SIZE = 5

const boardColumns: ApplicationColumn[] = [
  { id: "novos", titulo: "Novos" },
  { id: "entrevista-rh", titulo: "Entrevista RH" },
  { id: "entrevista-tecnica", titulo: "Entrevista Tecnica" },
  { id: "proposta", titulo: "Proposta" },
  { id: "contratado", titulo: "Contratado" },
  { id: "rejeitado", titulo: "Rejeitado" },
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

function pickStringArray(...values: Array<unknown>) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const items = value
        .flatMap((item) => pickString(item)?.split(/[,;\n]/) ?? [])
        .map((item) => item.trim())
        .filter((item): item is string => Boolean(item))

      if (items.length > 0) {
        return items
      }
    }

    if (typeof value === "string") {
      const items = value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      if (items.length > 0) {
        return items
      }
    }
  }

  return []
}

function isZipLocation(value?: string) {
  if (!value) {
    return false
  }

  const digitsOnly = value.replace(/\D/g, "")
  return digitsOnly.length === 8 && digitsOnly === value
}

function extractJobItems(payload: unknown): ApiJob[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is ApiJob => isRecord(item))
  }

  if (!isRecord(payload)) {
    return []
  }

  const container = payload as Record<string, unknown>
  const keys = ["items", "results", "data", "vagas", "jobs", "content"]

  for (const key of keys) {
    const value = container[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is ApiJob => isRecord(item))
    }
  }

  for (const value of Object.values(container)) {
    if (isRecord(value) || Array.isArray(value)) {
      const nested = extractJobItems(value)
      if (nested.length > 0) {
        return nested
      }
    }
  }

  return []
}

function normalizeCompanyJob(item: ApiJob, index: number): CompanyApplicationsJob | null {
  const idSource =
    pickString(item.id, item.slug, item.codigo, item.uuid, item.guid_id, item.pk) ?? `vaga-${index}`
  const jobGuid = pickString(item.guid_id, item.guid_vaga, item.uuid, item.id, item.codigo)
  const title = pickString(item.titulo, item.title, item.nome)

  if (!jobGuid || !title) {
    return null
  }

  const city = pickString(item.cidade, item.city)
  const state = pickString(item.estado, item.uf, item.state)
  const region = pickString(item.regiao, item.region)
  const cityState = city && state ? `${city}/${state}` : city ?? state
  const rawLocation = pickString(item.localizacao, item.location)
  const resolvedLocation =
    cityState ?? (rawLocation && !isZipLocation(rawLocation) ? rawLocation : undefined)
  const applyHref = `/candidaturas?vagaGuid=${encodeURIComponent(jobGuid)}`

  return {
    id: idSource,
    jobGuid,
    title,
    company:
      pickString(item.company, item.empresa, item.nome_empresa, item.companyId) ??
      "Empresa confidencial",
    location: resolvedLocation ?? "Localizacao nao informada",
    region,
    state,
    technicalSkills: pickStringArray(
      item.skills,
      item.habilidades,
      item.habilidades_tecnicas,
      item.technicalSkills,
      item.tecnologias,
      item.stack,
    ),
    workType:
      pickString(
        item.workType,
        item.tipoTrabalho,
        item.modalidade,
        item.tipoContratacao,
        item.tipo_contratacao,
        item.modelo_trabalho,
        item.regime,
        item.jornada,
        item.nivel,
      ) ?? "Tipo de contratacao nao informado",
    description:
      pickString(item.descricao, item.description, item.resumo, item.summary) ??
      "Descricao indisponivel no momento.",
    applyHref,
    isExternal: false,
    companyDetails: {
      segment: pickString(item.segmento, item.segment, item.setor, item.sector),
      industry: pickString(item.ramo_atuacao, item.ramoAtuacao, item.industry, item.area_atuacao),
      website: pickString(item.site, item.website),
      companyWebsite: pickString(item.site_empresa, item.siteEmpresa, item.companyWebsite),
      contactEmail: pickString(item.email, item.contactEmail, item.email_contato, item.contato_email),
    },
    team: pickString(item.area, item.team, item.departamento) ?? "Nao informado",
    createdBy: pickString(item.createdBy, item.criado_por, item.company, item.empresa) ?? "Nao informado",
    createdAt: pickString(item.createdAt, item.created_at, item.data_criacao) ?? "Nao informado",
    salaryRange: pickString(item.salaryRange, item.faixa_salarial) ?? "Nao informado",
    reportUrl: pickString(item.reportUrl, item.report_url, item.relatorio_url) ?? "Nao informado",
  }
}

function fallback(value?: string | null) {
  if (!value) return "Nao informado"
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "Nao informado"
}

export function resolveSelectedCompanyJobGuid(
  jobs: Array<Pick<CompanyApplicationsJob, "jobGuid">>,
  selectedJobGuid: string,
) {
  if (jobs.length === 0) {
    return ""
  }

  const selectedExists = jobs.some((job) => job.jobGuid === selectedJobGuid)
  if (selectedExists) {
    return selectedJobGuid
  }

  return jobs[0]?.jobGuid ?? ""
}

export function deriveCompanyApplicationsState(
  jobs: CompanyApplicationsJob[],
  searchQuery: string,
  selectedJobGuid: string,
  byJobId: Record<string, number>,
  currentPage: number,
) {
  const filteredJobs = filterJobs(jobs, searchQuery) as CompanyApplicationsJob[]
  const pageCount = getPageCount(filteredJobs.length, COMPANY_APPLICATIONS_PAGE_SIZE)
  const safePage = Math.min(Math.max(currentPage, 1), pageCount)

  return {
    filteredJobs,
    visibleJobs: getPaginatedJobs(filteredJobs, safePage, COMPANY_APPLICATIONS_PAGE_SIZE) as CompanyApplicationsJob[],
    filteredCandidateTotal: getCandidateTotalForJobs(filteredJobs, byJobId),
    resolvedSelectedJobGuid: resolveSelectedCompanyJobGuid(filteredJobs, selectedJobGuid),
    pageCount,
    resolvedCurrentPage: safePage,
  }
}

export function getCompanyApplicationsCandidateHelperText(
  status: CandidateCountState["status"],
  searchQuery: string,
) {
  if (status === "loading") {
    return "Atualizando contagem..."
  }

  if (status === "error") {
    return "Contagem indisponivel"
  }

  return searchQuery.trim() ? "Candidatos nas vagas filtradas" : "Candidatos nas vagas listadas"
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
}: {
  icon: typeof Users
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

export function CompanyApplicationsView({
  jobs,
  filteredJobs,
  visibleJobs,
  searchQuery,
  selectedJobGuid,
  currentPage,
  pageCount,
  currentJob,
  filteredCandidateTotal,
  candidateCounts,
  isLoadingJobs,
  jobsError,
  onSearchChange,
  onJobSelect,
  onPageChange,
  onOpenJobDetails,
  board,
}: CompanyApplicationsViewProps) {
  const hasJobs = jobs.length > 0
  const hasSearchResults = filteredJobs.length > 0

  return (
    <div className="flex min-h-screen bg-gray-50 text-black">
      <AtsSidebar activeItem="ats" />

      <main className="min-w-0 flex-1">
        <header className="border-b border-gray-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">ATS</p>
              <h1 className="mt-1 text-2xl font-semibold text-black">Pipeline de candidaturas</h1>
              <p className="mt-1 text-sm text-gray-600">
                Acompanhe candidatos por vaga com notas e visao detalhada do processo.
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-4 sm:p-6">
          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Users}
              label="Candidatos"
              value={filteredCandidateTotal}
              helper={getCompanyApplicationsCandidateHelperText(candidateCounts.status, searchQuery)}
            />
            <MetricCard
              icon={Briefcase}
              label="Vagas abertas"
              value={jobs.length}
              helper="Oportunidades carregadas"
            />
            <button
              type="button"
              onClick={onOpenJobDetails}
              disabled={!currentJob}
              className="rounded-lg border-2 border-[#FF6B00] bg-orange-50 p-5 text-left text-[#FF6B00] shadow-sm transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B00] text-white">
                <Briefcase className="size-5" />
              </div>
              <p className="text-2xl font-bold">Detalhes da vaga</p>
              <p className="mt-1 text-sm font-medium">
                {currentJob ? "Abrir contexto da vaga selecionada" : "Aguardando vaga disponivel"}
              </p>
            </button>
          </section>

          <section className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3">
              <div className="relative">
                <label htmlFor="company-applications-search" className="mb-2 block text-sm font-semibold text-gray-700">
                  Buscar vagas
                </label>
                <Search className="absolute left-3 top-[calc(50%+0.7rem)] size-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="company-applications-search"
                  type="text"
                  value={searchQuery}
                  onChange={onSearchChange}
                  onInput={onSearchChange}
                  placeholder="Buscar por vaga, descricao, local ou skills..."
                  className="w-full rounded-lg border-2 border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100"
                  disabled={!hasJobs && isLoadingJobs}
                />
              </div>
            </div>

            {isLoadingJobs ? (
              <p className="mt-3 text-sm font-medium text-gray-600">Carregando vagas...</p>
            ) : null}

            {!isLoadingJobs && searchQuery.trim() ? (
              <p className="mt-3 text-sm font-medium text-gray-600">
                {filteredJobs.length} vaga{filteredJobs.length === 1 ? "" : "s"} encontrada{filteredJobs.length === 1 ? "" : "s"}.
              </p>
            ) : null}

            {hasSearchResults ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
                  {visibleJobs.map((job) => {
                    const isActive = job.jobGuid === selectedJobGuid
                    return (
                      <button
                        key={job.jobGuid}
                        type="button"
                        onClick={() => onJobSelect(job.jobGuid ?? "")}
                        className={`rounded-lg border-2 p-4 text-left shadow-sm transition ${
                          isActive
                            ? "border-[#FF6B00] bg-orange-50"
                            : "border-gray-200 bg-white hover:border-[#FF6B00]"
                        }`}
                        aria-pressed={isActive}
                      >
                        <p className="text-sm font-semibold text-[#FF6B00]">{job.company}</p>
                        <p className="mt-1 text-base font-semibold text-black">{job.title}</p>
                        <p className="mt-2 text-sm text-gray-600">{job.location}</p>
                        <p className="mt-1 text-xs text-gray-500">{job.workType}</p>
                      </button>
                    )
                  })}
                </div>

                {pageCount > 1 ? (
                  <div className="flex items-center justify-between rounded-lg border-2 border-gray-200 bg-white p-3">
                    <button
                      type="button"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#FF6B00] hover:text-[#FF6B00] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ChevronLeft className="size-4" />
                      Anterior
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                      Pagina {currentPage} de {pageCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === pageCount}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#FF6B00] hover:text-[#FF6B00] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Proxima
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {jobsError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {jobsError}
            </div>
          ) : null}

          {!jobsError && !isLoadingJobs && !hasJobs ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
              Nenhuma vaga disponivel no momento para acompanhar candidaturas.
            </div>
          ) : null}

          {!jobsError && hasJobs && !hasSearchResults ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-600">
              Nenhuma vaga encontrada para a busca informada.
            </div>
          ) : null}

          {currentJob && hasSearchResults ? (
            <>
              <section className="rounded-lg border-2 border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#FF6B00]">{currentJob.company}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-black">{currentJob.title}</h2>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4" />
                        {currentJob.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="size-4" />
                        {currentJob.workType}
                      </span>
                    </div>
                  </div>

                  <span className="w-fit rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                    Pipeline ativo
                  </span>
                </div>

                <div className="mt-6 grid gap-3 text-sm text-gray-600 md:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Time</p>
                    <p className="mt-1 font-medium text-gray-700">{currentJob.team}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Criado por</p>
                    <p className="mt-1 font-medium text-gray-700">{currentJob.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Data de criacao</p>
                    <p className="mt-1 font-medium text-gray-700">{currentJob.createdAt}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Faixa salarial</p>
                    <p className="mt-1 font-medium text-gray-700">{currentJob.salaryRange}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border-2 border-gray-200 bg-white p-4 shadow-sm">
                {board}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}

export function CompanyApplicationsPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null)
  const [selectedJob, setSelectedJob] = useState<CompanyApplicationsJob | null>(null)
  const [selectedJobGuid, setSelectedJobGuid] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [jobs, setJobs] = useState<CompanyApplicationsJob[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [candidateOverrides, setCandidateOverrides] = useState<Record<string, Partial<Application>>>({})
  const [candidateNotesDraft, setCandidateNotesDraft] = useState("")
  const [isSavingCandidateNote, setIsSavingCandidateNote] = useState(false)
  const [candidateNoteFeedback, setCandidateNoteFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)
  const [candidateCounts, setCandidateCounts] = useState<CandidateCountState>({
    totalCandidates: 0,
    byJobId: {},
    status: "idle",
  })

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setIsLoadingJobs(true)
      setJobsError(null)

      try {
        const response = await fetch(JOBS_API_URL, { cache: "no-store" })
        if (!response.ok) {
          throw new Error(`Falha ao buscar vagas (${response.status}).`)
        }

        const payload: unknown = await response.json()
        const normalizedJobs = extractJobItems(payload)
          .map((item, index) => normalizeCompanyJob(item, index))
          .filter((job): job is CompanyApplicationsJob => job !== null)

        if (active) {
          setJobs(normalizedJobs)
        }
      } catch (error) {
        if (active) {
          setJobs([])
          setJobsError(
            error instanceof Error ? error.message : "Nao foi possivel carregar as vagas no momento.",
          )
        }
      } finally {
        if (active) {
          setIsLoadingJobs(false)
        }
      }
    }

    void loadJobs()

    return () => {
      active = false
    }
  }, [])

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
        if (!active) {
          return
        }

        setCandidateCounts({
          ...deriveCandidateMetrics(payload, jobs),
          status: "ready",
        })
      })
      .catch((fetchError) => {
        console.error("Erro ao buscar contagem de candidatos:", fetchError)
        if (!active) {
          return
        }

        setCandidateCounts({ totalCandidates: 0, byJobId: {}, status: "error" })
      })

    return () => {
      active = false
    }
  }, [jobs])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const {
    filteredJobs,
    visibleJobs,
    filteredCandidateTotal,
    resolvedSelectedJobGuid,
    pageCount,
    resolvedCurrentPage,
  } = useMemo(
    () =>
      deriveCompanyApplicationsState(
        jobs,
        searchQuery,
        selectedJobGuid,
        candidateCounts.byJobId,
        currentPage,
      ),
    [jobs, searchQuery, selectedJobGuid, candidateCounts.byJobId, currentPage],
  )

  useEffect(() => {
    if (resolvedSelectedJobGuid !== selectedJobGuid) {
      setSelectedJobGuid(resolvedSelectedJobGuid)
    }
  }, [resolvedSelectedJobGuid, selectedJobGuid])

  useEffect(() => {
    if (resolvedCurrentPage !== currentPage) {
      setCurrentPage(resolvedCurrentPage)
    }
  }, [resolvedCurrentPage, currentPage])

  const currentJob = useMemo(
    () => filteredJobs.find((job) => job.jobGuid === resolvedSelectedJobGuid) ?? null,
    [filteredJobs, resolvedSelectedJobGuid],
  )

  useEffect(() => {
    if (!currentJob && selectedJob) {
      setSelectedJob(null)
    }
  }, [currentJob, selectedJob])

  const hydratedSelectedCandidate = useMemo(() => {
    if (!selectedCandidate) {
      return null
    }

    return {
      ...selectedCandidate,
      ...(candidateOverrides[selectedCandidate.id] ?? {}),
    }
  }, [candidateOverrides, selectedCandidate])

  useEffect(() => {
    setCandidateNotesDraft(hydratedSelectedCandidate?.notes ?? "")
    setCandidateNoteFeedback(null)
  }, [hydratedSelectedCandidate?.id, hydratedSelectedCandidate?.notes])

  const handleSaveCandidateNote = async () => {
    if (!hydratedSelectedCandidate) {
      return
    }

    if (!hydratedSelectedCandidate.recordId) {
      setCandidateNoteFeedback({
        type: "error",
        message: "Nao foi possivel identificar o candidato para salvar a anotacao.",
      })
      return
    }

    setIsSavingCandidateNote(true)
    setCandidateNoteFeedback(null)

    try {
      const result = await updateCandidateNotes(
        hydratedSelectedCandidate.recordId,
        candidateNotesDraft,
      )

      const nextFields: Partial<Application> = {
        recordId: result.id ?? hydratedSelectedCandidate.recordId,
        notes: result.notes,
        atualizadoEm: result.updatedAt ?? hydratedSelectedCandidate.atualizadoEm,
      }

      setCandidateOverrides((previous) => ({
        ...previous,
        [hydratedSelectedCandidate.id]: {
          ...(previous[hydratedSelectedCandidate.id] ?? {}),
          ...nextFields,
        },
      }))

      setSelectedCandidate((previous) =>
        previous && previous.id === hydratedSelectedCandidate.id
          ? { ...previous, ...nextFields }
          : previous,
      )

      setCandidateNoteFeedback({
        type: "success",
        message: "Anotacao salva com sucesso.",
      })
    } catch (error) {
      setCandidateNoteFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Nao foi possivel salvar a anotacao.",
      })
    } finally {
      setIsSavingCandidateNote(false)
    }
  }

  const board = currentJob ? (
    <ApplicationBoardFromApi
      guidVaga={currentJob.jobGuid ?? ""}
      colunas={boardColumns}
      draggable={false}
      applicationOverrides={candidateOverrides}
      onApplicationSelect={(application) => setSelectedCandidate(application)}
    />
  ) : null

  return (
    <>
      <CompanyApplicationsView
        jobs={jobs}
        filteredJobs={filteredJobs}
        visibleJobs={visibleJobs}
        searchQuery={searchQuery}
        selectedJobGuid={resolvedSelectedJobGuid}
        currentPage={resolvedCurrentPage}
        pageCount={pageCount}
        currentJob={currentJob}
        filteredCandidateTotal={filteredCandidateTotal}
        candidateCounts={candidateCounts}
        isLoadingJobs={isLoadingJobs}
        jobsError={jobsError}
        onSearchChange={(event) => setSearchQuery(event.currentTarget.value)}
        onJobSelect={(jobGuid) => {
          setSelectedJobGuid(jobGuid)
          setSelectedCandidate(null)
        }}
        onPageChange={setCurrentPage}
        onOpenJobDetails={() => currentJob && setSelectedJob(currentJob)}
        board={board}
      />

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-gray-200 pb-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">ATS</p>
                <h2 className="mt-1 text-2xl font-semibold text-black">{selectedJob.title}</h2>
                <p className="mt-2 text-sm text-gray-600">
                  {selectedJob.team} - {selectedJob.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Guid da vaga</p>
                <p className="mt-2 text-base font-semibold text-black">{selectedJob.jobGuid}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Criador da vaga</p>
                <p className="mt-2 text-base font-semibold text-black">{selectedJob.createdBy}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Data de criacao</p>
                <p className="mt-2 text-base font-semibold text-black">{selectedJob.createdAt}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Faixa salarial</p>
                <p className="mt-2 text-base font-semibold text-black">{selectedJob.salaryRange}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modelo de trabalho</p>
                <p className="mt-2 text-base font-semibold text-black">{selectedJob.workType}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Relatorio</p>
                <p className="mt-2 text-sm font-semibold text-gray-700">{selectedJob.reportUrl}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Descricao da vaga</p>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {selectedJob.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {hydratedSelectedCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">ATS</p>
                <h2 className="mt-1 text-2xl font-semibold text-black">
                  {fallback(hydratedSelectedCandidate.nome)}
                </h2>
                <p className="text-sm text-gray-600">{fallback(hydratedSelectedCandidate.cargo)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-lg border-2 border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-[#FF6B00] hover:text-[#FF6B00]"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-700">{fallback(hydratedSelectedCandidate.email)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Telefone</p>
                <p className="text-sm font-medium text-gray-700">{fallback(hydratedSelectedCandidate.telefone)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Modelo de trabalho</p>
                <p className="text-sm font-medium text-gray-700">{fallback(hydratedSelectedCandidate.modeloTrabalho)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Senioridade</p>
                <p className="text-sm font-medium text-gray-700">{fallback(hydratedSelectedCandidate.senioridade)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Experiencia</p>
                <p className="text-sm font-medium text-gray-700">{fallback(hydratedSelectedCandidate.experiencia)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">LinkedIn</p>
                <p className="text-sm font-medium text-gray-700">{fallback(hydratedSelectedCandidate.linkedinUrl)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(hydratedSelectedCandidate.skills?.length
                  ? hydratedSelectedCandidate.skills
                  : ["Nao informado"]
                ).map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Anotacoes do recruiter</p>
                  <p className="mt-1 text-sm text-gray-600">
                    Esse texto fica vinculado ao candidato desta vaga e pode ser atualizado depois.
                  </p>
                </div>
                {hydratedSelectedCandidate.atualizadoEm ? (
                  <span className="text-xs text-gray-500">
                    Atualizado em {hydratedSelectedCandidate.atualizadoEm}
                  </span>
                ) : null}
              </div>

              <textarea
                value={candidateNotesDraft}
                onChange={(event) => setCandidateNotesDraft(event.target.value)}
                rows={5}
                placeholder="Registre observacoes sobre entrevista, proximos passos, riscos ou destaque do perfil."
                className="mt-4 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-orange-100"
              />

              {candidateNoteFeedback ? (
                <div
                  className={`mt-3 rounded-lg px-4 py-3 text-sm ${
                    candidateNoteFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {candidateNoteFeedback.message}
                </div>
              ) : null}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSaveCandidateNote()}
                  disabled={isSavingCandidateNote}
                  className="rounded-lg bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#e66000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCandidateNote ? "Salvando..." : "Salvar anotacao"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
