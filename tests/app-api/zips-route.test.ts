import { describe, expect, it, vi } from 'vitest'

import { GET, OPTIONS } from '@/app/api/zips/[zip]/route'

describe('/api/zips/[zip] route', () => {
  it('handles OPTIONS preflight', () => {
    const response = OPTIONS()
    expect(response.status).toBe(204)
  })

  it('returns 400 for invalid zip', async () => {
    const response = await GET(new Request('http://localhost/api/zips/123'), {
      params: Promise.resolve({ zip: '12-3' }),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'CEP inválido. Informe os 8 dígitos do CEP.' })
  })

  it('sanitizes zip and proxies upstream response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => '{"data":"Rua A - Centro - SP/SP"}',
      }),
    )

    const response = await GET(new Request('http://localhost/api/zips/01310100'), {
      params: Promise.resolve({ zip: '01310-100' }),
    })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"data":"Rua A - Centro - SP/SP"}')
  })

  it('returns 500 when upstream request crashes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await GET(new Request('http://localhost/api/zips/01310100'), {
      params: Promise.resolve({ zip: '01310100' }),
    })

    expect(response.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
