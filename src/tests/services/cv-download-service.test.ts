import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCandidateCvDownloadUrl } from '@/services/cv-download-service'

describe('getCandidateCvDownloadUrl', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the signed URL from the API data wrapper', async () => {
    const downloadUrl = 'https://clusterjobs.s3.us-east-1.amazonaws.com/cvs/test.pdf?signature=synthetic'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { downloadUrl } }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getCandidateCvDownloadUrl('candidate/id')).resolves.toBe(downloadUrl)
    expect(fetchMock).toHaveBeenCalledWith('/api/candidates/candidate%2Fid/cv-download', { cache: 'no-store' })
  })

  it('explains that the company can only download CVs linked to its own vacancies', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 }))

    await expect(getCandidateCvDownloadUrl('candidate-1'))
      .rejects.toThrow('O download deste currículo não está disponível. Você só pode baixar currículos vinculados às vagas da sua empresa.')
  })

  it('reports a temporary API failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    await expect(getCandidateCvDownloadUrl('candidate-1'))
      .rejects.toThrow('Não foi possível preparar o download do currículo. Tente novamente em instantes.')
  })

  it('rejects a malformed signing response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ downloadUrl: '/missing-wrapper' }) }))

    await expect(getCandidateCvDownloadUrl('candidate-1'))
      .rejects.toThrow('A API não retornou o link de download.')
  })
})
