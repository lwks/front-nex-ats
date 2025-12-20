import type { CandidateData } from "@/components/candidate-onboarding"
import { CANDIDATES_API_PROXY_URL } from "@/config"

export type CandidateProfilePayload = CandidateData & {
  guid_id: string
  cd_cnpj: string
}

export async function submitCandidateProfile(data: CandidateProfilePayload) {
  const response = await fetch(CANDIDATES_API_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }
}
