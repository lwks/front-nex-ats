import { beforeEach, describe, expect, it, vi } from 'vitest'

import { OPTIONS, POST } from '@/app/api/candidates/route'
const apiAuthorization = vi.hoisted(() => ({
  authorize: vi.fn().mockResolvedValue({ ok: true, accessToken: 'test-access-token' }),
}))
vi.mock('@/lib/auth/require-api-account-type', () => ({ authorizeApiAccountType: apiAuthorization.authorize }))

describe('/api/candidates route', () => {
  beforeEach(() => {
    apiAuthorization.authorize.mockResolvedValue({ ok: true, accessToken: 'test-access-token' })
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
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-access-token',
      } }),
    )
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
