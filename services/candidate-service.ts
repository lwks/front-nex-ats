import type { CandidateData } from "@/components/candidate-onboarding"
import { CANDIDATES_API_PROXY_URL } from "@/config"
import { areaValuesToNumbers } from "@/services/areas-service"

export type CandidateProfilePayload = CandidateData & {
  guid_id: string
  guid_vaga: string
  cd_cnpj: string
}

export async function submitCandidateProfile(data: CandidateProfilePayload) {
  const payload = {
    ...data,
    ...(data.industria ? { industria: areaValuesToNumbers([data.industria])[0] } : {}),
    ...(data.industriaInteresse
      ? { industriaInteresse: areaValuesToNumbers([data.industriaInteresse])[0] }
      : {}),
  }

  const response = await fetch(CANDIDATES_API_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }
}
