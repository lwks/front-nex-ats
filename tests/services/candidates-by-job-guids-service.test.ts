import { describe, expect, it, vi } from 'vitest'

import { fetchCandidatesByJobGuid } from '@/services/candidates-by-job-guids-service'

describe('fetchCandidatesByJobGuid', () => {
  it('throws when guid is empty', async () => {
    await expect(fetchCandidatesByJobGuid('   ')).rejects.toThrow('O parâmetro guid_vaga é obrigatório.')
  })

  it('requests candidates by normalized guid', async () => {
    const expected = { data: [{ id: 'cand-1' }] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => expected })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCandidatesByJobGuid('  vaga-1  ')

    expect(result).toEqual(expected)
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates/by-job-guids?guid_vaga=vaga-1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
  })

  it('throws when API returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not found', text: async () => 'none' }))

    await expect(fetchCandidatesByJobGuid('vaga-2')).rejects.toThrow('API request failed (404): none')
  })
})
