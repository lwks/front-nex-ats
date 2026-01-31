import { COMPANY_APPLICATIONS_API_URL } from "@/config"

export type CompanyApplicationPayload = {
  id: string
  status: string
  candidato: string
  vaga: string
}

export async function fetchCompanyApplications() {
  const response = await fetch(COMPANY_APPLICATIONS_API_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  return (await response.json()) as CompanyApplicationPayload[]
}
