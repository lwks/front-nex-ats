import { describe, expect, it } from 'vitest'

import {
  fetchContractTypeOptions,
  fetchExperienceOptions,
  fetchIndustryOptions,
  fetchWorkTypeOptions,
} from '@/services/onboarding-options-service'
import {
  defaultContractTypeOptions,
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultWorkTypeOptions,
} from '@/lib/onboarding-options'

describe('onboarding-options-service', () => {
  it('returns default experience options', async () => {
    await expect(fetchExperienceOptions()).resolves.toEqual(defaultExperienceOptions)
  })

  it('returns default industry options', async () => {
    await expect(fetchIndustryOptions()).resolves.toEqual(defaultIndustryOptions)
  })

  it('returns default work type options', async () => {
    await expect(fetchWorkTypeOptions()).resolves.toEqual(defaultWorkTypeOptions)
  })

  it('returns default contract type options', async () => {
    await expect(fetchContractTypeOptions()).resolves.toEqual(defaultContractTypeOptions)
  })
})
