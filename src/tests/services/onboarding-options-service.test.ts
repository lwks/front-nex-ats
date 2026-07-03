import { describe, expect, it } from "vitest"

import {
  fetchContractTypeOptions,
  fetchCurrentBenefitOptions,
  fetchExperienceOptions,
  fetchHardSkillOptions,
  fetchIndustryOptions,
  fetchInterestRoleAreaMap,
  fetchLanguageOptions,
  fetchSoftSkillOptions,
  fetchToolOptions,
  fetchTravelAvailabilityOptions,
  fetchWorkTypeOptions,
} from "@/services/onboarding-options-service"
import {
  defaultContractTypeOptions,
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultHardSkillOptions,
  defaultIndustryOptions,
  defaultInterestRoleAreaMap,
  defaultLanguageOptions,
  defaultSoftSkillOptions,
  defaultToolOptions,
  defaultTravelAvailabilityOptions,
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

  it("returns default hard skill options", async () => {
    await expect(fetchHardSkillOptions()).resolves.toEqual(defaultHardSkillOptions)
  })

  it("returns default soft skill options", async () => {
    await expect(fetchSoftSkillOptions()).resolves.toEqual(defaultSoftSkillOptions)
  })

  it("returns default tool options", async () => {
    await expect(fetchToolOptions()).resolves.toEqual(defaultToolOptions)
  })

  it("returns the default cargo to area map", async () => {
    await expect(fetchInterestRoleAreaMap()).resolves.toEqual(defaultInterestRoleAreaMap)
  })

  it("returns default travel availability options", async () => {
    await expect(fetchTravelAvailabilityOptions()).resolves.toEqual(defaultTravelAvailabilityOptions)
  })

  it("returns default current benefit options", async () => {
    await expect(fetchCurrentBenefitOptions()).resolves.toEqual(defaultCurrentBenefitOptions)
  })
})
