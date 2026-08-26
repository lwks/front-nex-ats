import { describe, expect, it, vi } from "vitest"

import {
  fetchContractTypeOptions,
  fetchCurrentBenefitOptions,
  fetchExperienceOptions,
  fetchHardSkillOptions,
  fetchIndustryOptions,
  fetchInterestRoleAreaMap,
  fetchLanguageOptions,
  fetchSeniorityOptions,
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
  defaultSeniorityOptions,
  defaultSoftSkillOptions,
  defaultToolOptions,
  defaultTravelAvailabilityOptions,
  defaultWorkTypeOptions,
} from "@/lib/onboarding-options"

describe("onboarding-options-service", () => {
  it("returns default experience options", async () => {
    await expect(fetchExperienceOptions()).resolves.toEqual(defaultExperienceOptions)
  })

  it("returns API area options", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ ID: 1, DS_AREA: "Finanças" }] }),
    }))

    await expect(fetchIndustryOptions()).resolves.toEqual([{ value: "1", label: "Finanças" }])
  })

  it("returns default work type options", async () => {
    await expect(fetchWorkTypeOptions()).resolves.toEqual(defaultWorkTypeOptions)
  })

  it("returns default contract type options", async () => {
    await expect(fetchContractTypeOptions()).resolves.toEqual(defaultContractTypeOptions)
  })

  it("returns default seniority options with leadership roles", async () => {
    await expect(fetchSeniorityOptions()).resolves.toEqual(defaultSeniorityOptions)
    await expect(fetchSeniorityOptions()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "coordenador", label: "Coordenador" }),
        expect.objectContaining({ value: "gerente", label: "Gerente" }),
        expect.objectContaining({ value: "diretor", label: "Diretor" }),
      ]),
    )
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
