"use client"

import { useEffect, useMemo, useState } from "react"

import {
  Application,
  ApplicationBoardFromApi,
  ApplicationColumn,
} from "@/components/application-board"
import { JOBS_API_URL } from "@/config"
import { updateCandidateNotes } from "@/services/candidate-notes-service"

type ApiJob = Record<string, unknown>

type JobOption = {
  guidVaga: string
  title: string
  location: string
  team: string
  createdBy: string
  createdAt: string
  salaryRange: string
  reportUrl: string
}

const boardColumns: ApplicationColumn[] = [
  { id: "novos", titulo: "Novos" },
  { id: "entrevista-rh", titulo: "Entrevista RH" },
  { id: "entrevista-tecnica", titulo: "Entrevista Técnica" },
  { id: "proposta", titulo: "Proposta" },
  { id: "contratado", titulo: "Contratado" },
  { id: "rejeitado", titulo: "Rejeitado" },
]

const menuItems = [
  { key: "minhas-vagas", label: "Minhas vagas", shortLabel: "MV", description: "Pipeline e candidatos" },
  { key: "extracao", label: "Extracao", shortLabel: "EX", description: "Relatorios e dados" },
  { key: "gerenciar-vagas", label: "Gerenciar Vagas", shortLabel: "GV", description: "Criacao e ajustes" },
] as const

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

function normalizeJob(item: ApiJob): JobOption | null {
  const guidVaga = pickString(item.guid_id, item.guid_vaga, item.id, item.codigo)
  const title = pickString(item.titulo, item.title, item.nome)

  if (!guidVaga || !title) {
    return null
  }

  return {
    guidVaga,
    title,
    location: pickString(item.localizacao, item.location, item.cidade, item.city) ?? "Não informado",
    team: pickString(item.area, item.team, item.departamento) ?? "Não informado",
    createdBy: pickString(item.createdBy, item.criado_por, item.company, item.empresa) ?? "Não informado",
    createdAt: pickString(item.createdAt, item.created_at, item.data_criacao) ?? "Não informado",
    salaryRange: pickString(item.salaryRange, item.faixa_salarial) ?? "Não informado",
    reportUrl: pickString(item.reportUrl, item.report_url, item.relatorio_url) ?? "Não informado",
  }
}

function fallback(value?: string | null) {
  if (!value) return "Não informado"
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : "Não informado"
}

export default function CompanyApplicationsPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobOption | null>(null)
  const [selectedGuidVaga, setSelectedGuidVaga] = useState("")
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [jobs, setJobs] = useState<JobOption[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [jobsError, setJobsError] = useState<string | null>(null)
  const [candidateOverrides, setCandidateOverrides] = useState<Record<string, Partial<Application>>>({})
  const [candidateNotesDraft, setCandidateNotesDraft] = useState("")
  const [isSavingCandidateNote, setIsSavingCandidateNote] = useState(false)
  const [candidateNoteFeedback, setCandidateNoteFeedback] = useState<{
    type: "success" | "error"
    message: string
  } | null>(null)

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
          .map((item) => normalizeJob(item))
          .filter((job): job is JobOption => job !== null)

        if (active) {
          setJobs(normalizedJobs)
        }
      } catch (error) {
        if (active) {
          setJobs([])
          setJobsError(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as vagas no momento.",
          )
        }
      } finally {
        if (active) {
          setIsLoadingJobs(false)
        }
      }
    }

    loadJobs()

    return () => {
      active = false
    }
  }, [])

  const currentJob = useMemo(
    () => jobs.find((job) => job.guidVaga === selectedGuidVaga) ?? null,
    [jobs, selectedGuidVaga],
  )

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
        message: "Não foi possível identificar o candidato para salvar a anotação.",
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
        message: "Anotação salva com sucesso.",
      })
    } catch (error) {
      setCandidateNoteFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar a anotação.",
      })
    } finally {
      setIsSavingCandidateNote(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col gap-6 px-4 py-8 md:flex-row lg:px-10">
        <aside
          className={`flex w-full flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 md:sticky md:top-8 md:h-[calc(100vh-4rem)] ${isSidebarCollapsed ? "md:w-24" : "md:w-72"}`}
        >
          <div className={`flex items-center justify-between px-4 py-4 ${isSidebarCollapsed ? "flex-col gap-3" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-xs font-semibold text-white">ATS</div>
              <div className={isSidebarCollapsed ? "hidden" : "block"}>
                <p className="text-sm font-semibold text-slate-900">Area da empresa</p>
                <p className="text-xs text-slate-500">Candidaturas</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 md:inline-flex"
              aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              aria-expanded={!isSidebarCollapsed}
            >
              {isSidebarCollapsed ? ">>" : "<<"}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <nav className="flex flex-1 flex-col gap-2 px-3 pb-4">
              {menuItems.map((item) => {
                const isActive = item.key === "minhas-vagas"
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${isActive ? "bg-slate-100" : "hover:bg-slate-50"}`}
                  >
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-semibold ${isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {item.shortLabel}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                      <span className="text-xs text-slate-500">{item.description}</span>
                    </span>
                  </button>
                )
              })}
            </nav>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-8 rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Empresa • Candidaturas</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Pipeline de candidatos por vaga</h1>
            <p className="mt-2 text-sm text-slate-500">Acompanhe o andamento das candidaturas em cada etapa do processo seletivo.</p>
          </header>

          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="space-y-2">
                <label htmlFor="job-guid-select" className="text-sm font-semibold text-slate-700">
                  Selecione a vaga
                </label>
                <select
                  id="job-guid-select"
                  value={selectedGuidVaga}
                  onChange={(event) => {
                    const guid = event.target.value
                    setSelectedGuidVaga(guid)
                    setSelectedCandidate(null)
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                  disabled={isLoadingJobs || Boolean(jobsError)}
                >
                  <option value="">Selecione uma vaga para carregar candidaturas</option>
                  {jobs.map((job) => (
                    <option key={job.guidVaga} value={job.guidVaga}>
                      {job.title} ({job.guidVaga})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => currentJob && setSelectedJob(currentJob)}
                disabled={!currentJob}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition enabled:hover:border-slate-300 enabled:hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Ver detalhes da vaga
              </button>
            </div>

            {isLoadingJobs ? (
              <p className="mt-4 text-sm text-slate-500">Carregando vagas...</p>
            ) : null}

            {jobsError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {jobsError}
              </div>
            ) : null}
          </section>

          {!selectedGuidVaga ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Selecione uma vaga para visualizar os candidatos por etapa.
            </section>
          ) : (
            <section className="space-y-6">
              <ApplicationBoardFromApi
                guidVaga={selectedGuidVaga}
                colunas={boardColumns}
                draggable={false}
                applicationOverrides={candidateOverrides}
                onApplicationSelect={(application) => setSelectedCandidate(application)}
              />
            </section>
          )}
        </main>
      </div>

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="h-[78vh] w-[78vw] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Detalhes da vaga</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{selectedJob.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{selectedJob.team} • {selectedJob.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Guid da vaga</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.guidVaga}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Criador da vaga</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.createdBy}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Data de criação</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.createdAt}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Faixa salarial</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.salaryRange}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 md:col-span-2 xl:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Relatório</p>
                <p className="mt-2 text-sm font-semibold text-slate-700">{selectedJob.reportUrl}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {hydratedSelectedCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Perfil do candidato</p>
                <h2 className="text-2xl font-semibold text-slate-900">{fallback(hydratedSelectedCandidate.nome)}</h2>
                <p className="text-sm text-slate-500">{fallback(hydratedSelectedCandidate.cargo)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p><p className="text-sm font-medium text-slate-700">{fallback(hydratedSelectedCandidate.email)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Telefone</p><p className="text-sm font-medium text-slate-700">{fallback(hydratedSelectedCandidate.telefone)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modelo de trabalho</p><p className="text-sm font-medium text-slate-700">{fallback(hydratedSelectedCandidate.modeloTrabalho)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Senioridade</p><p className="text-sm font-medium text-slate-700">{fallback(hydratedSelectedCandidate.senioridade)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Experiência</p><p className="text-sm font-medium text-slate-700">{fallback(hydratedSelectedCandidate.experiencia)}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">LinkedIn</p>
                <p className="text-sm font-medium text-slate-700">{fallback(hydratedSelectedCandidate.linkedinUrl)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(hydratedSelectedCandidate.skills?.length ? hydratedSelectedCandidate.skills : ["Não informado"]).map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{skill}</span>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Anotações do recruiter</p>
                  <p className="mt-1 text-sm text-slate-500">Esse texto fica vinculado ao candidato desta vaga e pode ser atualizado depois.</p>
                </div>
                {hydratedSelectedCandidate.atualizadoEm ? (
                  <span className="text-xs text-slate-400">Atualizado em {hydratedSelectedCandidate.atualizadoEm}</span>
                ) : null}
              </div>

              <textarea
                value={candidateNotesDraft}
                onChange={(event) => setCandidateNotesDraft(event.target.value)}
                rows={5}
                placeholder="Registre observações sobre entrevista, próximos passos, riscos ou destaque do perfil."
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />

              {candidateNoteFeedback ? (
                <div
                  className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
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
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingCandidateNote ? "Salvando..." : "Salvar anotação"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
