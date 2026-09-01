import {
  defaultContractTypeOptions,
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultHardSkillOptions,
  defaultInterestRoleOptions,
  defaultInterestRoleAreaMap,
  defaultLanguageOptions,
  defaultLanguageProficiencyOptions,
  defaultSeniorityOptions,
  defaultSoftSkillOptions,
  defaultToolOptions,
  defaultTravelAvailabilityOptions,
  defaultWorkTypeOptions,
} from "@/lib/onboarding-options"
import { fetchAreaOptions } from "@/services/areas-service"

export function fetchExperienceOptions() {
  return Promise.resolve(defaultExperienceOptions)
}

export function fetchIndustryOptions() {
  return fetchAreaOptions()
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

export function fetchHardSkillOptions() {
  return Promise.resolve(defaultHardSkillOptions)
}

export function fetchSoftSkillOptions() {
  return Promise.resolve(defaultSoftSkillOptions)
}

export function fetchCurrentBenefitOptions() {
  return Promise.resolve(defaultCurrentBenefitOptions)
}

export function fetchInterestRoleOptions() {
  return Promise.resolve(defaultInterestRoleOptions)
}

export function fetchInterestRoleAreaMap() {
  return Promise.resolve(defaultInterestRoleAreaMap)
}

export function fetchToolOptions() {
  return Promise.resolve(defaultToolOptions)
}

export function fetchTravelAvailabilityOptions() {
  return Promise.resolve(defaultTravelAvailabilityOptions)
}
