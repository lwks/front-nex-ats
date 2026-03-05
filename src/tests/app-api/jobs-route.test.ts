import { describe, expect, it, vi } from 'vitest'

import { OPTIONS, POST } from '@/app/api/jobs/route'

describe('/api/jobs route', () => {

  it('proxies POST response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: async () => '{"job":"created"}',
      }),
    )

    const request = new Request('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ title: 'Dev' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    expect(await response.text()).toBe('{"job":"created"}')
  })

  it('returns 500 when upstream fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const request = new Request('http://localhost/api/jobs', {
      method: 'POST',
      body: JSON.stringify({ title: 'Dev' }),
    })

    const response = await POST(request)

    expect(response.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
