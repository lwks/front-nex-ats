import { CANDIDATES_API_PROXY_URL } from "@/config"
import { areaValuesToNumbers } from "@/services/areas-service"
import { validateUserRegistrationData, type UserRegistrationData } from "@/services/user-registration-service"

export type CandidateProfilePayload = UserRegistrationData & {
  guid_id: string
  guid_vaga: string
}

export async function submitCandidateProfile(data: CandidateProfilePayload) {
  validateUserRegistrationData(data)
  if (!data.guid_id.trim() || !data.guid_vaga.trim()) {
    throw new Error("Não foi possível identificar a vaga ou a candidatura.")
  }

  const payload = {
    ...data,
    industriaInteresse: areaValuesToNumbers(data.industriaInteresse),
    areaPreferencia: areaValuesToNumbers(data.areaPreferencia),
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
