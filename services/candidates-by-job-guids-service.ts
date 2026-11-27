import { CANDIDATES_BY_JOB_GUIDS_API_PROXY_URL } from "@/config"

export async function fetchCandidatesByJobGuid(guidVaga: string, scope: 'pipeline' | 'history' = 'pipeline'): Promise<unknown> {
  return fetchCandidatesByJobGuids([guidVaga], scope)
}

export async function fetchCandidatesByJobGuids(guidVagas: string[], scope: 'pipeline' | 'history' = 'pipeline'): Promise<unknown> {
  const normalizedGuids = guidVagas
    .map((guid) => guid.trim())
    .filter((guid) => guid.length > 0)

  if (normalizedGuids.length === 0) {
    throw new Error("O parâmetro guid_vaga é obrigatório.")
  }

  const params = new URLSearchParams()
  normalizedGuids.forEach((guid) => params.append("guid_vaga", guid))
  if (scope !== 'pipeline') params.set('scope', scope)

  const response = await fetch(`${CANDIDATES_BY_JOB_GUIDS_API_PROXY_URL}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  return response.json()
}
