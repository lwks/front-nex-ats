import { normalizeReportCandidates, normalizeReportJobs, type ReportCandidate, type ReportJob } from "@/lib/ats-report"

type JobsPage = {
  jobs: ReportJob[]
  lastKey: string | null
}

export type CompanyReportData = {
  jobs: ReportJob[]
  candidates: ReportCandidate[]
}

const JOBS_PAGE_SIZE = 50
const CANDIDATE_GUID_CHUNK_SIZE = 20

async function readJsonResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  return response.json()
}

async function fetchJobsPage(lastKey?: string): Promise<JobsPage> {
  const params = new URLSearchParams({ limit: String(JOBS_PAGE_SIZE) })
  if (lastKey) {
    params.set("lastKey", lastKey)
  }

  const response = await fetch(`/api/jobs?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  const payload: unknown = await readJsonResponse(response)
  const jobs = normalizeReportJobs(payload)
  const nextLastKey =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).lastKey ??
        ((payload as Record<string, unknown>).data as Record<string, unknown> | undefined)?.lastKey ??
        null
      : null

  return {
    jobs,
    lastKey: typeof nextLastKey === "string" && nextLastKey.trim().length > 0 ? nextLastKey : null,
  }
}

export async function fetchCompanyReportData(): Promise<CompanyReportData> {
  const jobs: ReportJob[] = []
  let lastKey: string | null = null

  do {
    const page = await fetchJobsPage(lastKey ?? undefined)
    jobs.push(...page.jobs)
    lastKey = page.lastKey
  } while (lastKey)

  const uniqueJobs = Array.from(new Map(jobs.map((job) => [job.jobGuid, job])).values())
  const candidates: ReportCandidate[] = []
  const jobGuids = uniqueJobs.map((job) => job.jobGuid)

  for (let index = 0; index < jobGuids.length; index += CANDIDATE_GUID_CHUNK_SIZE) {
    const batch = jobGuids.slice(index, index + CANDIDATE_GUID_CHUNK_SIZE)
    const params = new URLSearchParams()
    batch.forEach((guid) => params.append("guid_vaga", guid))

    const response = await fetch(`/api/candidates/by-job-guids?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    const payload: unknown = await readJsonResponse(response)
    candidates.push(...normalizeReportCandidates(payload))
  }

  return {
    jobs: uniqueJobs,
    candidates,
  }
}
