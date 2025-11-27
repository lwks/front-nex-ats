import type { CandidateData } from "@/components/candidate-onboarding"
import { apiFetch } from "./api-client"

const CANDIDATE_ENDPOINT = "/candidates"

export async function submitCandidateProfile(data: CandidateData) {
  await apiFetch(CANDIDATE_ENDPOINT, {
    method: "POST",
    body: JSON.stringify(data),
  })
}
