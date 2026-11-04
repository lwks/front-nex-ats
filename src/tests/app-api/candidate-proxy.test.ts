import { afterEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ authorize: vi.fn() }))
vi.mock('@/lib/auth/require-api-account-type', () => ({ authorizeApiAccountType: auth.authorize }))
import { candidateProxy } from '@/lib/candidate-proxy'

afterEach(() => vi.unstubAllGlobals())

describe('candidate profile and application proxy', () => {
  it('requires candidate account before contacting the API', async () => {
    auth.authorize.mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) })
    const upstream = vi.fn()
    vi.stubGlobal('fetch', upstream)
    const response = await candidateProxy(new Request('http://localhost/api/candidates/me/profile'), '/me/profile', 'GET')
    expect(response.status).toBe(403)
    expect(auth.authorize).toHaveBeenCalledWith('CANDIDATE')
    expect(upstream).not.toHaveBeenCalled()
  })

  it('forwards the bearer token and preserves conflict responses', async () => {
    auth.authorize.mockResolvedValue({ ok: true, accessToken: 'candidate-token' })
    const upstream = vi.fn().mockResolvedValue(new Response('{"message":"duplicate"}', { status: 409,
      headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', upstream)
    const response = await candidateProxy(new Request('http://localhost/api/candidates/applications', {
      method: 'POST', body: JSON.stringify({ guid_vaga: 'job-1' }),
    }), '/applications', 'POST')
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ message: 'duplicate' })
    expect(upstream.mock.calls[0][1].headers.Authorization).toBe('Bearer candidate-token')
  })
})
