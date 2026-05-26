export type ApiJob = {
  id?: string | number
  slug?: string
  codigo?: string | number
  uuid?: string
  pk?: string
  guid_id?: string
  titulo?: string
  title?: string
  nome?: string
  empresa?: string
  company?: string
  nome_empresa?: string
  localizacao?: string
  location?: string
  cidade?: string
  city?: string
  estado?: string
  uf?: string
  state?: string
  modalidade?: string
  modelo_trabalho?: string
  workType?: string
  formato_contratacao?: string
  tipo_contratacao?: string
  tipoContratacao?: string
  descricao?: string
  description?: string
  resumo?: string
  summary?: string
  skills?: unknown
  habilidades?: unknown
  habilidades_tecnicas?: unknown
  technicalSkills?: unknown
  tecnologias?: unknown
  stack?: unknown
  beneficios?: unknown
  benefits?: unknown
  requirements?: unknown
  requisitos?: unknown
  responsibilities?: unknown
  responsabilidades?: unknown
  exibir_salario?: boolean
  show_salary?: boolean
  salario?: string
  salary?: string
  orcamento?: {
    valor_inicial?: number | string
    valor_final?: number | string
  } | null
} & Record<string, unknown>

export type JobBoardJob = {
  id: string
  guid: string | null
  title: string
  company: string
  location: string
  workType: string
  contractType: string
  salary: string
  description: string
  skills: string[]
  benefits: string[]
  requirements: string[]
  responsibilities: string[]
  applyHref: string
}

export type JobBoardPage = {
  jobs: JobBoardJob[]
  lastKey: string | null
}

const JOB_COLLECTION_KEYS = ["items", "results", "data", "vagas", "jobs", "content"] as const
const BRL_CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
})

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

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value)
    }
  }

  return undefined
}

function pickNumber(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string") {
      const normalized = Number(value.replace(/\./g, "").replace(",", "."))
      if (Number.isFinite(normalized)) {
        return normalized
      }
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
        .filter((item): item is string => item.length > 0)

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

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

function extractJobsCollection(payload: unknown): ApiJob[] {
  if (Array.isArray(payload)) {
    return payload as ApiJob[]
  }

  if (!isRecord(payload)) {
    return []
  }

  for (const key of JOB_COLLECTION_KEYS) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value as ApiJob[]
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value) || isRecord(value)) {
      const nestedJobs = extractJobsCollection(value)
      if (nestedJobs.length > 0) {
        return nestedJobs
      }
    }
  }

  return []
}

function extractLastKey(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null
  }

  const directLastKey = pickString(payload.lastKey)
  if (directLastKey) {
    return directLastKey
  }

  for (const key of JOB_COLLECTION_KEYS) {
    const value = payload[key]
    if (isRecord(value)) {
      const nestedLastKey = extractLastKey(value)
      if (nestedLastKey) {
        return nestedLastKey
      }
    }
  }

  return null
}

function isZipCode(value?: string) {
  if (!value) {
    return false
  }

  const digitsOnly = value.replace(/\D/g, "")
  return digitsOnly.length === 8 && digitsOnly === value
}

function formatSalary(job: ApiJob) {
  const shouldShowSalary = job.exibir_salario === true || job.show_salary === true
  const explicitSalary = pickString(job.salario, job.salary)

  if (explicitSalary) {
    return explicitSalary
  }

  if (!shouldShowSalary) {
    return "Salário a combinar"
  }

  const budget = isRecord(job.orcamento) ? job.orcamento : null
  const initialValue = pickNumber(budget?.valor_inicial)
  const finalValue = pickNumber(budget?.valor_final)

  if (initialValue != null && finalValue != null) {
    return `${BRL_CURRENCY_FORMATTER.format(initialValue)} - ${BRL_CURRENCY_FORMATTER.format(finalValue)}`
  }

  if (initialValue != null) {
    return `A partir de ${BRL_CURRENCY_FORMATTER.format(initialValue)}`
  }

  if (finalValue != null) {
    return `Até ${BRL_CURRENCY_FORMATTER.format(finalValue)}`
  }

  return "Salário a combinar"
}

export function buildJobApplicationHref(id: string, guid?: string | null) {
  if (guid) {
    return `/candidaturas?vagaGuid=${encodeURIComponent(guid)}`
  }

  return `/candidaturas?vaga=${encodeURIComponent(id)}`
}

export function normalizeJobBoardJob(job: ApiJob, index: number): JobBoardJob {
  const id =
    pickString(job.id, job.slug, job.codigo, job.uuid, job.guid_id, job.pk) ?? `vaga-${index + 1}`
  const guid = pickString(job.guid_id, job.uuid) ?? null
  const city = pickString(job.cidade, job.city)
  const state = pickString(job.estado, job.uf, job.state)
  const rawLocation = pickString(job.localizacao, job.location)
  const cityState = city && state ? `${city}/${state}` : city ?? state
  const location = cityState ?? (rawLocation && !isZipCode(rawLocation) ? rawLocation : undefined) ?? "Localização não informada"

  return {
    id,
    guid,
    title: pickString(job.titulo, job.title, job.nome) ?? "Vaga sem título",
    company: pickString(job.empresa, job.company, job.nome_empresa) ?? "Empresa confidencial",
    location,
    workType:
      pickString(job.modelo_trabalho, job.modalidade, job.workType) ?? "Modelo de trabalho não informado",
    contractType:
      pickString(job.formato_contratacao, job.tipo_contratacao, job.tipoContratacao) ?? "Contrato não informado",
    salary: formatSalary(job),
    description:
      pickString(job.descricao, job.description, job.resumo, job.summary) ?? "Descrição indisponível no momento.",
    skills: pickStringArray(
      job.skills,
      job.habilidades,
      job.habilidades_tecnicas,
      job.technicalSkills,
      job.tecnologias,
      job.stack,
    ),
    benefits: pickStringArray(job.beneficios, job.benefits),
    requirements: pickStringArray(job.requirements, job.requisitos),
    responsibilities: pickStringArray(job.responsibilities, job.responsabilidades),
    applyHref: buildJobApplicationHref(id, guid),
  }
}

export function normalizeJobBoardPage(payload: unknown): JobBoardPage {
  const jobs = extractJobsCollection(payload).map((job, index) => normalizeJobBoardJob(job, index))

  return {
    jobs,
    lastKey: extractLastKey(payload),
  }
}

export function filterJobBoardJobs(jobs: JobBoardJob[], query: string) {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (!normalizedQuery) {
    return jobs
  }

  return jobs.filter((job) => {
    const searchableText = normalizeSearchText(
      [
        job.title,
        job.company,
        job.location,
        job.workType,
        job.contractType,
        job.description,
        ...job.skills,
      ].join(" "),
    )

    return searchableText.includes(normalizedQuery)
  })
}

export function mergeJobBoardJobs(currentJobs: JobBoardJob[], incomingJobs: JobBoardJob[]) {
  const byId = new Map(currentJobs.map((job) => [job.id, job]))

  for (const job of incomingJobs) {
    byId.set(job.id, job)
  }

  return [...byId.values()]
}
