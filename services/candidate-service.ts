import type { CandidateData } from "@/components/candidate-onboarding"
import { apiFetch } from "./api-client"

const CANDIDATE_ENDPOINT = "/candidates"

export type CandidateProfilePayload = CandidateData & {
  guid_id: string
  cd_cnpj: string
}

export async function submitCandidateProfile(data: CandidateProfilePayload) {
  await apiFetch(CANDIDATE_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
