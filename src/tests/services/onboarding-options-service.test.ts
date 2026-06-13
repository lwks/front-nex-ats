import { describe, expect, it } from "vitest"

import {
  fetchContractTypeOptions,
  fetchCurrentBenefitOptions,
  fetchExperienceOptions,
  fetchIndustryOptions,
  fetchLanguageOptions,
  fetchProfessionalSkillOptions,
  fetchWorkTypeOptions,
} from "@/services/onboarding-options-service"
import {
  defaultContractTypeOptions,
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultLanguageOptions,
  defaultProfessionalSkillOptions,
  defaultWorkTypeOptions,
} from "@/lib/onboarding-options"

describe("onboarding-options-service", () => {
  it("returns default experience options", async () => {
    await expect(fetchExperienceOptions()).resolves.toEqual(defaultExperienceOptions)
  })

  it("returns default industry options", async () => {
    await expect(fetchIndustryOptions()).resolves.toEqual(defaultIndustryOptions)
  })

  it("returns default work type options", async () => {
    await expect(fetchWorkTypeOptions()).resolves.toEqual(defaultWorkTypeOptions)
  })

  it("returns default contract type options", async () => {
    await expect(fetchContractTypeOptions()).resolves.toEqual(defaultContractTypeOptions)
  })

  it("returns default language options", async () => {
    await expect(fetchLanguageOptions()).resolves.toEqual(defaultLanguageOptions)
  })

  it("returns default professional skill options", async () => {
    await expect(fetchProfessionalSkillOptions()).resolves.toEqual(defaultProfessionalSkillOptions)
  })

  it("returns default current benefit options", async () => {
    await expect(fetchCurrentBenefitOptions()).resolves.toEqual(defaultCurrentBenefitOptions)
  })
})
