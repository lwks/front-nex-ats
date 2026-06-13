import {
  defaultContractTypeOptions,
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultLanguageOptions,
  defaultProfessionalSkillOptions,
  defaultWorkTypeOptions,
} from "@/lib/onboarding-options"

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

export function fetchLanguageOptions() {
  return Promise.resolve(defaultLanguageOptions)
}

export function fetchProfessionalSkillOptions() {
  return Promise.resolve(defaultProfessionalSkillOptions)
}

export function fetchCurrentBenefitOptions() {
  return Promise.resolve(defaultCurrentBenefitOptions)
}
