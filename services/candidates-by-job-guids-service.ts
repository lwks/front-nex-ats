import { CANDIDATES_BY_JOB_GUIDS_API_PROXY_URL } from "@/config"

export async function fetchCandidatesByJobGuid(guidVaga: string): Promise<unknown> {
  const normalizedGuid = guidVaga.trim()

  if (!normalizedGuid) {
    throw new Error("O parâmetro guid_vaga é obrigatório.")
  }

  const params = new URLSearchParams({ guid_vaga: normalizedGuid })
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
