import {
  defaultContractTypeOptions,
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultInterestRoleOptions,
  defaultLanguageOptions,
  defaultLanguageProficiencyOptions,
  defaultProfessionalSkillOptions,
  defaultSeniorityOptions,
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

export function fetchSeniorityOptions() {
  return Promise.resolve(defaultSeniorityOptions)
}

export function fetchLanguageOptions() {
  return Promise.resolve(defaultLanguageOptions)
}

export function fetchLanguageProficiencyOptions() {
  return Promise.resolve(defaultLanguageProficiencyOptions)
}

export function fetchProfessionalSkillOptions() {
  return Promise.resolve(defaultProfessionalSkillOptions)
}

export function fetchCurrentBenefitOptions() {
  return Promise.resolve(defaultCurrentBenefitOptions)
}

export function fetchInterestRoleOptions() {
  return Promise.resolve(defaultInterestRoleOptions)
}
