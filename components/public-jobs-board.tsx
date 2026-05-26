"use client"

import Link from "next/link"
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react"
import {
  Briefcase,
  Clock3,
  Filter,
  LogIn,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react"

import { filterJobBoardJobs, mergeJobBoardJobs, type JobBoardJob } from "@/lib/job-board"
import { cn } from "@/lib/utils"
import { fetchPublicJobsPage } from "@/services/public-jobs-service"

import { Button } from "./ui/button"

const INITIAL_PAGE_LIMIT = 6
const EMPTY_INITIAL_JOBS: JobBoardJob[] = []
const STATS = [
  { number: "500+", label: "Vagas abertas" },
  { number: "200+", label: "Empresas parceiras" },
  { number: "10k+", label: "Profissionais conectados" },
  { number: "50+", label: "Cidades atendidas" },
] as const

export type PublicJobsBoardViewProps = {
  jobs: JobBoardJob[]
  query: string
  onQueryChange: (value: string) => void
  selectedJob: JobBoardJob | null
  onOpenJob: (job: JobBoardJob) => void
  onCloseJob: () => void
  onLoadMore: () => void
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  hasMore: boolean
}

export function hasInitialPublicJobs(initialJobs?: JobBoardJob[]) {
  return (initialJobs?.length ?? 0) > 0
}

export function PublicJobsBoard({
  initialJobs,
  initialLastKey = null,
}: {
  initialJobs?: JobBoardJob[]
  initialLastKey?: string | null
}) {
  const resolvedInitialJobs = initialJobs ?? EMPTY_INITIAL_JOBS
  const hasInitialJobs = hasInitialPublicJobs(resolvedInitialJobs)
  const [jobs, setJobs] = useState<JobBoardJob[]>(resolvedInitialJobs)
  const [query, setQuery] = useState("")
  const [selectedJob, setSelectedJob] = useState<JobBoardJob | null>(null)
  const [lastKey, setLastKey] = useState<string | null>(initialLastKey)
  const [isLoading, setIsLoading] = useState(!hasInitialJobs)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasInitialJobs) {
      return
    }

    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    fetchPublicJobsPage({ limit: INITIAL_PAGE_LIMIT, signal: controller.signal })
      .then((page) => {
        setJobs(page.jobs)
        setLastKey(page.lastKey)
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") {
          return
        }

        console.error("Erro ao carregar vagas públicas:", fetchError)
        setError("Não foi possível carregar as vagas no momento. Tente novamente em instantes.")
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [hasInitialJobs])

  const handleLoadMore = () => {
    if (!lastKey || isLoadingMore) {
      return
    }

    setIsLoadingMore(true)
    setError(null)

    fetchPublicJobsPage({ limit: INITIAL_PAGE_LIMIT, lastKey })
      .then((page) => {
        setJobs((currentJobs) => mergeJobBoardJobs(currentJobs, page.jobs))
        setLastKey(page.lastKey)
      })
      .catch((fetchError) => {
        console.error("Erro ao carregar mais vagas:", fetchError)
        setError("Não foi possível carregar mais vagas agora. Tente novamente em instantes.")
      })
      .finally(() => {
        setIsLoadingMore(false)
      })
  }

  const handleQueryChange = (value: string) => {
    startTransition(() => {
      setQuery(value)
    })
  }

  return (
    <PublicJobsBoardView
      jobs={jobs}
      query={query}
      onQueryChange={handleQueryChange}
      selectedJob={selectedJob}
      onOpenJob={setSelectedJob}
      onCloseJob={() => setSelectedJob(null)}
      onLoadMore={handleLoadMore}
      isLoading={isLoading}
      isLoadingMore={isLoadingMore}
      error={error}
      hasMore={Boolean(lastKey)}
    />
  )
}

export function PublicJobsBoardView({
  jobs,
  query,
  onQueryChange,
  selectedJob,
  onOpenJob,
  onCloseJob,
  onLoadMore,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
}: PublicJobsBoardViewProps) {
  const deferredQuery = useDeferredValue(query)
  const filteredJobs = useMemo(() => filterJobBoardJobs(jobs, deferredQuery), [jobs, deferredQuery])
  const showEmptyState = !isLoading && !error && jobs.length === 0
  const showSearchEmptyState = !isLoading && jobs.length > 0 && filteredJobs.length === 0

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,107,0,0.16),_transparent_42%),linear-gradient(180deg,_#fff8f1_0%,_#ffffff_22%,_#fbfbfb_100%)] text-slate-950">
      <header className="border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4">
          <Link href="/jobs/list" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FF6B00] text-white shadow-[0_12px_30px_rgba(255,107,0,0.28)]">
              <Briefcase className="size-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">ClusterHR</p>
              <p className="text-sm text-slate-500">Job Board</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#vagas" className="transition hover:text-[#FF6B00]">Vagas</a>
              <a href="#como-funciona" className="transition hover:text-[#FF6B00]">Como funciona</a>
              <a href="#contato" className="transition hover:text-[#FF6B00]">Contato</a>
            </nav>
            <Button asChild className="rounded-full bg-[#FF6B00] px-5 text-white hover:bg-[#E55F00]">
              <Link href="/api/auth/login">
                <LogIn className="size-4" />
                Entrar no ATS
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-black/5">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,420px)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/20 bg-[#FF6B00]/10 px-4 py-2 text-sm font-medium text-[#C44E00]">
              <Sparkles className="size-4" />
              Recrutamento mais claro, rápido e humano
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Encontre sua próxima oportunidade com a ClusterHR.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explore vagas reais, veja os detalhes com clareza e siga direto para a candidatura sem fricção.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Empresas validadas</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Fluxo direto para candidatura</span>
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Dados vindos da API real</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-slate-950 p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <p className="text-sm uppercase tracking-[0.32em] text-orange-200">Busca de vagas</p>
            <h2 className="mt-3 text-2xl font-semibold">Descubra funções alinhadas ao seu perfil</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Pesquise por cargo, empresa, skill ou localização e refine os resultados em tempo real.
            </p>

            <div className="mt-6 space-y-3 rounded-[1.5rem] bg-white p-3 text-slate-900">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                <Search className="size-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => onQueryChange(event.currentTarget.value)}
                  placeholder="Cargo, empresa, skill ou localidade"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500">
                  <MapPin className="size-4 text-slate-400" />
                  Brasil remoto e híbrido
                </div>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-400"
                >
                  <Filter className="size-4" />
                  Filtros em breve
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-10 text-white" id="como-funciona">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-semibold text-[#FF6B00]">{stat.number}</p>
              <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <main id="vagas" className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF6B00]">Vagas em destaque</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Oportunidades abertas agora</h2>
            <p className="mt-2 text-sm text-slate-600">
              {filteredJobs.length} vaga{filteredJobs.length === 1 ? "" : "s"} encontrada{filteredJobs.length === 1 ? "" : "s"}
              {query.trim() ? " para a sua busca." : "."}
            </p>
          </div>
          <Link
            href="/jobs/create"
            className="inline-flex items-center justify-center rounded-full border border-[#FF6B00] px-5 py-3 text-sm font-semibold text-[#FF6B00] transition hover:bg-[#FF6B00] hover:text-white"
          >
            Publicar nova vaga
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`job-skeleton-${index}`}
                className="min-h-[280px] animate-pulse rounded-[1.75rem] border border-slate-200 bg-white/80 p-6"
              >
                <div className="h-5 w-2/3 rounded-full bg-slate-200" />
                <div className="mt-3 h-4 w-1/3 rounded-full bg-slate-200" />
                <div className="mt-8 h-4 w-full rounded-full bg-slate-100" />
                <div className="mt-2 h-4 w-5/6 rounded-full bg-slate-100" />
                <div className="mt-8 h-10 w-32 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <h3 className="text-xl font-semibold text-slate-950">Nenhuma vaga disponível no momento</h3>
            <p className="mt-3 text-sm text-slate-600">Volte em breve para acompanhar novas oportunidades publicadas.</p>
          </div>
        ) : null}

        {showSearchEmptyState ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <h3 className="text-xl font-semibold text-slate-950">Nenhum resultado para essa busca</h3>
            <p className="mt-3 text-sm text-slate-600">Tente combinar menos termos ou buscar por cidade, skill ou empresa.</p>
          </div>
        ) : null}

        {filteredJobs.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <article
                key={job.id}
                className="group flex h-full flex-col rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_28px_55px_rgba(15,23,42,0.1)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                    <Briefcase className="size-7" />
                  </div>
                  <span className="rounded-full bg-[#FFF1E8] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#C44E00]">
                    {job.salary}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{job.title}</h3>
                  <p className="mt-2 text-sm font-medium text-slate-600">{job.company}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                    <MapPin className="size-4" />
                    {job.location}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                    <Briefcase className="size-4" />
                    {job.workType}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                    <Clock3 className="size-4" />
                    {job.contractType}
                  </span>
                </div>

                <p className="mt-5 line-clamp-4 text-sm leading-7 text-slate-600">{job.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(job.skills.length > 0 ? job.skills.slice(0, 4) : ["Informações em atualização"]).map((skill) => (
                    <span
                      key={`${job.id}-${skill}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                  <button
                    type="button"
                    onClick={() => onOpenJob(job)}
                    className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E55F00]"
                  >
                    Ver detalhes
                  </button>
                  <Link
                    href={job.applyHref}
                    className="text-sm font-semibold text-slate-700 transition group-hover:text-[#FF6B00]"
                  >
                    Ir para candidatura
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {hasMore && filteredJobs.length > 0 ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={cn(
                "rounded-full border-2 border-[#FF6B00] px-8 py-3 text-sm font-semibold text-[#FF6B00] transition",
                isLoadingMore ? "cursor-wait opacity-70" : "hover:bg-[#FF6B00] hover:text-white",
              )}
            >
              {isLoadingMore ? "Carregando..." : "Carregar mais vagas"}
            </button>
          </div>
        ) : null}
      </main>

      <footer id="contato" className="border-t border-black/5 bg-slate-950 py-12 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-[#FF6B00] text-white">
                <Briefcase className="size-5" />
              </div>
              <div>
                <p className="font-semibold">ClusterHR</p>
                <p className="text-sm text-slate-400">Job Board</p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">
              Conectando talentos e empresas com uma experiência mais objetiva desde a descoberta até a candidatura.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-200">Acesso rápido</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <Link href="/jobs/list" className="block transition hover:text-[#FF6B00]">Todas as vagas</Link>
              <Link href="/jobs/create" className="block transition hover:text-[#FF6B00]">Cadastrar vaga</Link>
              <Link href="/api/auth/login" className="block transition hover:text-[#FF6B00]">Entrar no ATS</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-orange-200">Contato</p>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
              <p>talentos@clusterhr.com.br</p>
              <p>+55 11 99999-0000</p>
              <p>São Paulo, Brasil</p>
            </div>
          </div>
        </div>
      </footer>

      <PublicJobDetailsModal job={selectedJob} onClose={onCloseJob} />
    </div>
  )
}

export function PublicJobDetailsModal({
  job,
  onClose,
}: {
  job: JobBoardJob | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!job) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [job, onClose])

  if (!job) {
    return null
  }

  const detailSections = [
    { title: "Responsabilidades", items: job.responsibilities },
    { title: "Requisitos", items: job.requirements },
    { title: "Benefícios", items: job.benefits },
  ].filter((section) => section.items.length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_35px_90px_rgba(15,23,42,0.24)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6 border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[#FF6B00]">{job.company}</p>
            <h3 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{job.title}</h3>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                <MapPin className="size-4" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                <Briefcase className="size-4" />
                {job.workType}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                <Clock3 className="size-4" />
                {job.contractType}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-950"
            aria-label="Fechar detalhes da vaga"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Faixa salarial</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-[#FF6B00]">{job.salary}</p>
              </div>

              <section className="mt-6">
                <h4 className="text-lg font-semibold text-slate-950">Descrição da vaga</h4>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{job.description}</p>
              </section>

              {detailSections.map((section) => (
                <section key={section.title} className="mt-6">
                  <h4 className="text-lg font-semibold text-slate-950">{section.title}</h4>
                  <ul className="mt-3 space-y-3 text-sm text-slate-600">
                    {section.items.map((item) => (
                      <li key={`${section.title}-${item}`} className="flex gap-3">
                        <span className="mt-2 size-2 rounded-full bg-[#FF6B00]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <h4 className="text-lg font-semibold text-slate-950">Resumo rápido</h4>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div>
                  <p className="font-semibold text-slate-950">Empresa</p>
                  <p className="mt-1">{job.company}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Localização</p>
                  <p className="mt-1">{job.location}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Modelo</p>
                  <p className="mt-1">{job.workType}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Contrato</p>
                  <p className="mt-1">{job.contractType}</p>
                </div>
                {job.skills.length > 0 ? (
                  <div>
                    <p className="font-semibold text-slate-950">Skills</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.skills.map((skill) => (
                        <span
                          key={`modal-skill-${skill}`}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-8 flex flex-col gap-3">
                <Link
                  href={job.applyHref}
                  className="inline-flex items-center justify-center rounded-full bg-[#FF6B00] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#E55F00]"
                >
                  Candidatar-se agora
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Voltar para a lista
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
