import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET, OPTIONS } from '@/app/api/candidates/by-job-guids/route'
import { CANDIDATES_BY_JOB_GUIDS_API_URL } from '@/config'

describe('/api/candidates/by-job-guids route', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('returns CORS headers for OPTIONS', async () => {
    const response = await OPTIONS()

    expect(response.status).toBe(204)
  })

  it('returns 400 when no valid guid_vaga is informed', async () => {
    const request = new Request('http://localhost/api/candidates/by-job-guids?guid_vaga=   &guid_vaga=')

    const response = await GET(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'O parâmetro guid_vaga é obrigatório.' })
  })

  it('proxies request with 3 GUIDs to upstream API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: async () => '{"data":[]}',
    })
    vi.stubGlobal('fetch', fetchMock)

    const request = new Request('http://localhost/api/candidates/by-job-guids?guid_vaga=job-1,job-2&guid_vaga=job-3')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"data":[]}')
    expect(fetchMock).toHaveBeenCalledWith(
      `${CANDIDATES_BY_JOB_GUIDS_API_URL}?guid_vaga=job-1&guid_vaga=job-2&guid_vaga=job-3`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      },
    )
  })

  it('propagates upstream error response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 502,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => '{"message":"upstream failure"}',
      }),
    )

    const request = new Request('http://localhost/api/candidates/by-job-guids?guid_vaga=job-1&guid_vaga=job-2')
    const response = await GET(request)

    expect(response.status).toBe(502)
    expect(await response.text()).toBe('{"message":"upstream failure"}')
  })
})
