import { describe, expect, it, vi } from 'vitest'

import { submitCandidateProfile } from '@/services/candidate-service'

describe('submitCandidateProfile', () => {
  it('posts candidate payload to proxy endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const payload = {
      guid_id: 'cand-1',
      guid_vaga: 'job-1',
      cd_cnpj: '123',
      nome: 'Maria',
    }

    await submitCandidateProfile(payload as never)

    expect(fetchMock).toHaveBeenCalledWith('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('throws when upstream fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 422, statusText: 'Unprocessable', text: async () => 'invalid payload' }),
    )

    await expect(submitCandidateProfile({} as never)).rejects.toThrow('API request failed (422): invalid payload')
  })
})
