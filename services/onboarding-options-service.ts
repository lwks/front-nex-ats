import {
  defaultContractTypeOptions,
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultWorkTypeOptions,
} from '@/lib/onboarding-options'

export function fetchExperienceOptions() {
  return Promise.resolve(defaultExperienceOptions)
}

export function fetchIndustryOptions() {
  return Promise.resolve(defaultIndustryOptions)
}

export function fetchWorkTypeOptions() {
  return Promise.resolve(defaultWorkTypeOptions)
}

export function fetchContractTypeOptions() {
  return Promise.resolve(defaultContractTypeOptions)
}
