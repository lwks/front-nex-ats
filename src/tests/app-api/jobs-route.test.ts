import { describe, expect, it, vi } from 'vitest'

import { GET, OPTIONS, POST } from '@/app/api/jobs/route'

describe('/api/jobs route', () => {
  it('proxies GET response with limit and lastKey', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      text: async () => '{"data":{"items":[{"id":"job-1"}],"lastKey":"cursor-1"}}',
    })
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET(new Request('http://localhost/api/jobs?limit=6&lastKey=cursor-1'))

    expect(fetchMock).toHaveBeenCalledWith(
      'https://qqkukhkx3ee4of2muxjlb7f3l40qeari.lambda-url.us-east-1.on.aws/api/jobs?limit=6&lastKey=cursor-1',
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      },
    )
    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"data":{"items":[{"id":"job-1"}],"lastKey":"cursor-1"}}')
  })

  it('returns 500 when GET fails unexpectedly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const response = await GET(new Request('http://localhost/api/jobs?limit=6'))

    expect(response.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })

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
