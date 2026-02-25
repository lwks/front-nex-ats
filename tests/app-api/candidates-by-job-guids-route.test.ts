import { describe, expect, it, vi } from 'vitest'

import { GET, OPTIONS } from '@/app/api/candidates/by-job-guids/route'

describe('/api/candidates/by-job-guids route', () => {

  it('returns 400 when guid_vaga is missing', async () => {
    const request = new Request('http://localhost/api/candidates/by-job-guids')

    const response = await GET(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'O parâmetro guid_vaga é obrigatório.' })
  })

  it('proxies GET request to upstream API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => '{"data":[]}',
      }),
    )

    const request = new Request('http://localhost/api/candidates/by-job-guids?guid_vaga=job-1')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"data":[]}')
  })

  it('returns 500 when upstream throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const request = new Request('http://localhost/api/candidates/by-job-guids?guid_vaga=job-1')
    const response = await GET(request)

    expect(response.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
