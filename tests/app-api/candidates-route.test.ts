import { describe, expect, it, vi } from 'vitest'

import { OPTIONS, POST } from '@/app/api/candidates/route'

describe('/api/candidates route', () => {
  it('handles OPTIONS preflight', () => {
    const response = OPTIONS()
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('proxies POST body and status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => '{"id":"1"}',
      }),
    )

    const request = new Request('http://localhost/api/candidates', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ana' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(await response.text()).toBe('{"id":"1"}')
  })

  it('returns 500 on unexpected errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const request = new Request('http://localhost/api/candidates', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ana' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
