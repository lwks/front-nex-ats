import {
  defaultContractTypeOptions,
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultWorkTypeOptions,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { apiFetchWithFallback } from "./api-client"

const EXPERIENCE_ENDPOINT = "/onboarding/experience-levels"
const INDUSTRY_ENDPOINT = "/onboarding/industries"
const WORK_TYPE_ENDPOINT = "/onboarding/work-types"
const CONTRACT_TYPE_ENDPOINT = "/onboarding/contract-types"

export function fetchExperienceOptions() {
  return apiFetchWithFallback<OnboardingOption[]>(EXPERIENCE_ENDPOINT, defaultExperienceOptions)
}

export function fetchIndustryOptions() {
  return apiFetchWithFallback<OnboardingOption[]>(INDUSTRY_ENDPOINT, defaultIndustryOptions)
}

export function fetchWorkTypeOptions() {
  return apiFetchWithFallback<OnboardingOption[]>(WORK_TYPE_ENDPOINT, defaultWorkTypeOptions)
}

export function fetchContractTypeOptions() {
  return apiFetchWithFallback<OnboardingOption[]>(CONTRACT_TYPE_ENDPOINT, defaultContractTypeOptions)
}
