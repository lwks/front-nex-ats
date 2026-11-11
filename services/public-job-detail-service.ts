import { normalizeJobBoardJob, type ApiJob, type JobBoardJob } from "@/lib/job-board"

export async function fetchPublicJobDetail(guid: string, signal?: AbortSignal): Promise<JobBoardJob> {
  const response = await fetch(`/api/jobs/${encodeURIComponent(guid)}`, {
    signal,
    cache: "no-store",
  })

  if (!response.ok) throw new Error(`Job request failed (${response.status})`)

  const payload: unknown = await response.json()
  const data = payload && typeof payload === "object" && "data" in payload ? payload.data : null
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid job response")

  const job = data as ApiJob
  if (!job.guid_id || !job.titulo) throw new Error("Invalid job response")
  return normalizeJobBoardJob(job, 0)
}
