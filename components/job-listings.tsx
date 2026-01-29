import { JOBS_API_URL } from "@/config"

import { Header } from "./header"
import { JobListingsClient } from "./job-listings-client"

type ApiJob = {
  id?: string | number
  slug?: string
  codigo?: string | number
  uuid?: string
  pk?: string
  sk?: string
  guid_id?: string
  entityType?: string
  titulo?: string
  title?: string
  nome?: string
  empresa?: string
  company?: string
  nome_empresa?: string
  companyId?: string | number
  localizacao?: string
  location?: string
  cidade?: string
  city?: string
  estado?: string
  uf?: string
  state?: string
  modalidade?: string
  modelo_trabalho?: string
  tipoContratacao?: string
  tipo_contratacao?: string
  tipoTrabalho?: string
  workType?: string
  regime?: string
  jornada?: string
  nivel?: string
  publicada_em?: string
  createdAt?: string
  updatedAt?: string
  descricao?: string
  description?: string
  resumo?: string
  summary?: string
  applyUrl?: string
  apply_url?: string
  link?: string
  linkCandidatura?: string
  candidatura_url?: string
  candidatura_link?: string
  segmento?: string
  segment?: string
  setor?: string
  sector?: string
  ramo_atuacao?: string
  ramoAtuacao?: string
  industry?: string
  area_atuacao?: string
  site?: string
  website?: string
  site_empresa?: string
  siteEmpresa?: string
  companyWebsite?: string
  email?: string
  contactEmail?: string
  email_contato?: string
  contato_email?: string
} & Record<string, unknown>

type JobCard = {
  id: string
  title: string
  company: string
  location: string
  workType: string
  description: string
  applyHref: string
  isExternal: boolean
  companyDetails: {
    segment?: string
    industry?: string
    website?: string
    companyWebsite?: string
    contactEmail?: string
  }
}

type ApiPayload = ApiJob[] | Record<string, unknown>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

const JOB_COLLECTION_KEYS = ["items", "results", "data", "vagas", "jobs", "content"]

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

function isZipLocation(value?: string) {
  if (!value) {
    return false
  }

  const digitsOnly = value.replace(/\D/g, "")
  return digitsOnly.length === 8 && digitsOnly === value
}

function extractJobs(payload: unknown): ApiJob[] {
  if (Array.isArray(payload)) {
    return payload as ApiJob[]
  }

  if (!isRecord(payload)) {
    return []
  }

  const container = payload as Record<string, unknown>

  for (const key of JOB_COLLECTION_KEYS) {
    const value = container[key]
    if (Array.isArray(value)) {
      return value as ApiJob[]
    }
  }

  for (const key of JOB_COLLECTION_KEYS) {
    const value = container[key]
    if (isRecord(value)) {
      const nestedJobs = extractJobs(value)
      if (nestedJobs.length > 0) {
        return nestedJobs
      }
    }
  }

  for (const value of Object.values(container)) {
    if (Array.isArray(value)) {
      return value as ApiJob[]
    }

    if (isRecord(value)) {
      const nestedJobs = extractJobs(value)
      if (nestedJobs.length > 0) {
        return nestedJobs
      }
    }
  }

  return []
}

function normalizeJob(job: ApiJob, index: number): JobCard {
  const idSource =
    pickString(job.id, job.slug, job.codigo, job.uuid, job.guid_id, job.pk) ?? `vaga-${index}`
  const city = pickString(job.cidade, job.city)
  const state = pickString(job.estado, job.uf, job.state)
  const cityState = city && state ? `${city}/${state}` : city ?? state

  const title = pickString(job.titulo, job.title, job.nome) ?? "Vaga sem título"
  const company =
    pickString(job.company, job.empresa, job.nome_empresa) ??
    (job.companyId ? `Empresa ${job.companyId}` : undefined) ??
    "Empresa confidencial" // todo: check empresa em /jobs
  const rawLocation = pickString(job.localizacao, job.location)
  const resolvedLocation =
    cityState ?? (rawLocation && !isZipLocation(rawLocation) ? rawLocation : undefined)
  const location = resolvedLocation ?? "Localização não informada" // todo: check localização em /jobs
  const workType =
    pickString(
      job.workType,
      job.tipoTrabalho,
      job.modalidade,
      job.tipoContratacao,
      job.tipo_contratacao,
      job.modelo_trabalho,
      job.regime,
      job.jornada,
      job.nivel,
    ) ?? "Tipo de contratação não informado" // todo: check tipo de trabalho em /jobs
  const description =
    pickString(job.descricao, job.description, job.resumo, job.summary) ??
    "Descrição indisponível no momento." // todo: check descrição em /jobs
  const companyDetails = {
    segment: pickString(job.segmento, job.segment, job.setor, job.sector),
    industry: pickString(job.ramo_atuacao, job.ramoAtuacao, job.industry, job.area_atuacao),
    website: pickString(job.site, job.website),
    companyWebsite: pickString(job.site_empresa, job.siteEmpresa, job.companyWebsite),
    contactEmail: pickString(job.email, job.contactEmail, job.email_contato, job.contato_email),
  }

  const applyCandidate = pickString(
    job.applyUrl,
    job.apply_url,
    job.link,
    job.linkCandidatura,
    job.candidatura_url,
    job.candidatura_link,
  )
  const fallbackHref = `/candidaturas?vaga=${encodeURIComponent(idSource)}`
  const applyHref = applyCandidate ?? fallbackHref
  const isExternal = !!applyCandidate && /^https?:\/\//.test(applyHref)

  return {
    id: idSource,
    title,
    company,
    location,
    workType,
    description,
    applyHref,
    isExternal,
    companyDetails,
  }
}

async function fetchJobs(): Promise<{ jobs: JobCard[]; error?: string }> {
  try {
    // Using "no-store" avoids serving a cached response right after creating a
    // new job via the form, ensuring the latest data is shown on redirect.
    const response = await fetch(JOBS_API_URL, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const payload: ApiPayload = await response.json()
    const jobs = extractJobs(payload).map((job, index) => normalizeJob(job, index))

    return { jobs }
  } catch (error) {
    console.error("Erro ao buscar vagas:", error)
    return {
      jobs: [],
      error: "Não foi possível carregar as vagas no momento. Tente novamente em instantes.",
    }
  }
}

export async function JobListings() {
  const { jobs, error } = await fetchJobs()
  const showEmptyState = !error && jobs.length === 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <header className="mb-12 text-center md:text-left">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Encontre sua próxima oportunidade
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Vagas em destaque na NexJob
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:w-2/3">
            Explore as oportunidades disponíveis e escolha aquela que mais combina com o seu momento
            profissional. Ao se candidatar você será redirecionado para completar o cadastro.
          </p>
        </header>

        {error ? (
          <div className="mb-8 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {jobs.length > 0 ? (
          <JobListingsClient jobs={jobs} />
        ) : null}

        {showEmptyState ? (
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Nenhuma vaga disponível no momento. Volte em breve para conferir novas oportunidades.
          </p>
        ) : null}
      </main>
    </div>
  )
}
