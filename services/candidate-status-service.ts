import { CANDIDATES_API_PROXY_URL } from "@/config"
import { mapBoardStatusToApiStatus } from "@/lib/application-status"
import type { ApplicationStatus } from "@/lib/application-status"

export type CandidateStatusUpdateResult = {
  id?: string
  status: ApplicationStatus | string
  updatedAt?: string
}

type UpdateCandidateStatusResponse = {
  id?: string
  status?: ApplicationStatus | string
  updatedAt?: string
  updated_at?: string
}

export async function updateCandidateStatus(
  candidateId: string,
  status: ApplicationStatus,
): Promise<CandidateStatusUpdateResult> {
  const response = await fetch(`${CANDIDATES_API_PROXY_URL}/${encodeURIComponent(candidateId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: mapBoardStatusToApiStatus(status) }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as UpdateCandidateStatusResponse

  return {
    id: payload.id,
    status: payload.status ?? status,
    updatedAt: payload.updatedAt ?? payload.updated_at,
  }
}
