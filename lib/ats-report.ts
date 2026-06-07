export type ReportJob = {
  id: string
  jobGuid: string
  title: string
  location: string
  workType: string
}

export type ReportCandidate = {
  id: string
  jobGuid: string
  stage: string
}

export type ReportSlice = {
  label: string
  value: number
  color: string
}

export type AtsReportMetrics = {
  totalOpenJobs: number
  totalCandidates: number
  selectedJobTitle: string | null
  candidatesPerJob: ReportSlice[]
  candidatesByStage: ReportSlice[]
  jobsCoverage: ReportSlice[]
}

const JOB_COLLECTION_KEYS = ["items", "results", "data", "vagas", "jobs", "content"] as const
const CANDIDATE_COLLECTION_KEYS = ["items", "results", "data", "candidatos", "candidates", "content"] as const
const REPORT_COLORS = ["#FF6B00", "#FF9F1C", "#2E86AB", "#3A86FF", "#588157", "#8E44AD", "#C0392B"] as const

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

function extractCollectionItems(payload: unknown, collectionKeys: readonly string[]): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => isRecord(item))
  }

  if (!isRecord(payload)) {
    return []
  }

  for (const key of collectionKeys) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => isRecord(item))
    }
  }

  for (const value of Object.values(payload)) {
    if (Array.isArray(value) || isRecord(value)) {
      const nested = extractCollectionItems(value, collectionKeys)
      if (nested.length > 0) {
        return nested
      }
    }
  }

  return []
}

function assignColors(entries: Array<{ label: string; value: number }>): ReportSlice[] {
  return entries.map((entry, index) => ({
    ...entry,
    color: REPORT_COLORS[index % REPORT_COLORS.length],
  }))
}

function normalizeStage(rawStage?: string) {
  const normalized = (rawStage ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

  if (
    normalized.includes("rejeitado") ||
    normalized.includes("reprovado") ||
    normalized.includes("nao aderente")
  ) {
    return "Rejeitado"
  }

  if (normalized.includes("contratado") || normalized.includes("admissao") || normalized.includes("hired")) {
    return "Contratado"
  }

  if (normalized.includes("oferta") || normalized.includes("proposta")) {
    return "Proposta"
  }

  if (
    normalized.includes("tecnica") ||
    normalized === "hm" ||
    normalized.includes("gestor") ||
    normalized.includes("case") ||
    normalized.includes("teste")
  ) {
    return "Entrevista tecnica"
  }

  if (normalized === "rh" || normalized.includes("recrutador") || normalized.includes("people")) {
    return "Entrevista RH"
  }

  if (
    normalized.includes("novo") ||
    normalized.includes("triagem") ||
    normalized.includes("curriculo") ||
    normalized.includes("inicial")
  ) {
    return "Novos"
  }

  return rawStage?.trim() || "Novos"
}

export function normalizeReportJobs(payload: unknown): ReportJob[] {
  return extractCollectionItems(payload, JOB_COLLECTION_KEYS)
    .map((item, index) => {
      const id = pickString(item.id, item.slug, item.codigo, item.uuid, item.guid_id, item.pk) ?? `vaga-${index + 1}`
      const jobGuid = pickString(item.guid_id, item.guid_vaga, item.id, item.codigo)
      const title = pickString(item.titulo, item.title, item.nome)

      if (!jobGuid || !title) {
        return null
      }

      return {
        id,
        jobGuid,
        title,
        location: pickString(item.localizacao, item.location, item.cidade, item.city) ?? "Nao informado",
        workType: pickString(
          item.workType,
          item.tipoTrabalho,
          item.modalidade,
          item.tipoContratacao,
          item.tipo_contratacao,
          item.modelo_trabalho,
          item.regime,
          item.jornada,
        ) ?? "Nao informado",
      }
    })
    .filter((item): item is ReportJob => item !== null)
}

export function normalizeReportCandidates(payload: unknown): ReportCandidate[] {
  return extractCollectionItems(payload, CANDIDATE_COLLECTION_KEYS)
    .map((item, index) => {
      const id = pickString(item.guid_id, item.id, item.codigo, item.pk) ?? `candidato-${index + 1}`
      const jobGuid = pickString(
        item.guid_vaga,
        item.vagaGuid,
        item.jobGuid,
        item.job_guid,
        item.id_vaga,
        item.vaga_id,
      )

      if (!jobGuid) {
        return null
      }

      return {
        id,
        jobGuid,
        stage: normalizeStage(
          pickString(item.status, item.etapa, item.stage, item.situacao, item.situation),
        ),
      }
    })
    .filter((item): item is ReportCandidate => item !== null)
}

export function buildAtsReportMetrics(
  jobs: ReportJob[],
  candidates: ReportCandidate[],
  selectedJobGuid?: string,
): AtsReportMetrics {
  const normalizedSelection = selectedJobGuid?.trim()
  const activeJobs = normalizedSelection
    ? jobs.filter((job) => job.jobGuid === normalizedSelection)
    : jobs
  const activeJobGuids = new Set(activeJobs.map((job) => job.jobGuid))
  const activeCandidates = normalizedSelection
    ? candidates.filter((candidate) => activeJobGuids.has(candidate.jobGuid))
    : candidates.filter((candidate) => jobs.some((job) => job.jobGuid === candidate.jobGuid))

  const selectedJobTitle = normalizedSelection
    ? activeJobs.find((job) => job.jobGuid === normalizedSelection)?.title ?? null
    : null

  const candidatesPerJobMap = activeCandidates.reduce<Record<string, number>>((acc, candidate) => {
    acc[candidate.jobGuid] = (acc[candidate.jobGuid] ?? 0) + 1
    return acc
  }, {})

  const candidatesPerJob = assignColors(
    activeJobs
      .map((job) => ({
        label: job.title,
        value: candidatesPerJobMap[job.jobGuid] ?? 0,
      }))
      .filter((entry) => entry.value > 0),
  )

  const candidatesByStageMap = activeCandidates.reduce<Record<string, number>>((acc, candidate) => {
    acc[candidate.stage] = (acc[candidate.stage] ?? 0) + 1
    return acc
  }, {})

  const candidatesByStage = assignColors(
    Object.entries(candidatesByStageMap)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value),
  )

  const jobsWithCandidates = activeJobs.filter((job) => (candidatesPerJobMap[job.jobGuid] ?? 0) > 0).length
  const jobsWithoutCandidates = Math.max(activeJobs.length - jobsWithCandidates, 0)

  const jobsCoverage = assignColors([
    { label: "Vagas com candidatos", value: jobsWithCandidates },
    { label: "Vagas sem candidatos", value: jobsWithoutCandidates },
  ]).filter((entry) => entry.value > 0 || activeJobs.length > 0)

  return {
    totalOpenJobs: activeJobs.length,
    totalCandidates: activeCandidates.length,
    selectedJobTitle,
    candidatesPerJob,
    candidatesByStage,
    jobsCoverage,
  }
}
