import { CANDIDATES_API_PROXY_URL } from "@/config"

type UpdateCandidateNotesResponse = {
  id?: string
  updatedAt?: string
  updated_at?: string
  anotacoes?: string
  anotacao?: string
  notes?: string
  note?: string
}

export type CandidateNotesUpdateResult = {
  id?: string
  updatedAt?: string
  notes: string
}

function resolveNotes(payload: UpdateCandidateNotesResponse) {
  return (
    payload.anotacoes ??
    payload.anotacao ??
    payload.notes ??
    payload.note ??
    ""
  )
}

export async function updateCandidateNotes(
  candidateId: string,
  notes: string,
): Promise<CandidateNotesUpdateResult> {
  const response = await fetch(`${CANDIDATES_API_PROXY_URL}/${encodeURIComponent(candidateId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      anotacoes: notes.trim(),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  const payload = (await response.json()) as UpdateCandidateNotesResponse

  return {
    id: payload.id,
    updatedAt: payload.updatedAt ?? payload.updated_at,
    notes: resolveNotes(payload),
  }
}
