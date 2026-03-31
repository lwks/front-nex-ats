import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchCandidatesByJobGuid, fetchCandidatesByJobGuids } from '@/services/candidates-by-job-guids-service'

describe('fetchCandidatesByJobGuids', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throws when guid list is empty', async () => {
    await expect(fetchCandidatesByJobGuids([])).rejects.toThrow('O parâmetro guid_vaga é obrigatório.')
  })

  it('requests candidates using 3 normalized guid_vaga query params', async () => {
    const expected = { data: [{ id: 'cand-1' }] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => expected })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCandidatesByJobGuids(['  vaga-1  ', 'vaga-2', ' vaga-3 '])

    expect(result).toEqual(expected)
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates/by-job-guids?guid_vaga=vaga-1&guid_vaga=vaga-2&guid_vaga=vaga-3', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
  })

  it('propagates upstream errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 502, statusText: 'Bad gateway', text: async () => 'upstream error' }),
    )

    await expect(fetchCandidatesByJobGuids(['vaga-2'])).rejects.toThrow('API request failed (502): upstream error')
  })
})

describe('fetchCandidatesByJobGuid', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('delegates to fetchCandidatesByJobGuids for single guid', async () => {
    const expected = { data: [] }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => expected })
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchCandidatesByJobGuid(' job-1 ')

    expect(result).toEqual(expected)
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates/by-job-guids?guid_vaga=job-1', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
  })
})
