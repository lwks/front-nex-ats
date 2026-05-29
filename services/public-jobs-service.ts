import { normalizeJobBoardPage, type JobBoardPage } from "@/lib/job-board"

type FetchPublicJobsPageOptions = {
  limit?: number
  lastKey?: string | null
  signal?: AbortSignal
}

export async function fetchPublicJobsPage({
  limit = 6,
  lastKey,
  signal,
}: FetchPublicJobsPageOptions = {}): Promise<JobBoardPage> {
  const params = new URLSearchParams()
  params.set("limit", String(limit))

  if (lastKey) {
    params.set("lastKey", lastKey)
  }

  const response = await fetch(`/api/jobs?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  const payload = await response.json()
  return normalizeJobBoardPage(payload)
}
