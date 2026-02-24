import { describe, expect, it, vi } from 'vitest'

import { fetchCompanyApplications } from '@/services/applications-service'

describe('fetchCompanyApplications', () => {
  it('returns company applications list', async () => {
    const expected = [{ id: '1', status: 'PENDING', candidato: 'c1', vaga: 'v1' }]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => expected }))

    const result = await fetchCompanyApplications()

    expect(result).toEqual(expected)
  })

  it('throws when response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Error', text: async () => 'boom' }))

    await expect(fetchCompanyApplications()).rejects.toThrow('API request failed (500): boom')
  })
})
