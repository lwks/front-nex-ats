import { describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ claims: vi.fn() }))
vi.mock('@/lib/auth/supabase-server', () => ({ getVerifiedClaims: auth.claims }))

describe('GET /api/auth/session', () => {
  it('returns a verified account summary', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    auth.claims.mockResolvedValue({ sub: 'user-1', email: 'user@example.com', exp: 1900000000, app_metadata: { account_type: 'COMPANY' } })
    const { GET } = await import('@/app/api/auth/session/route')
    const response = await GET()
    expect(await response.json()).toMatchObject({ authenticated: true, accountType: 'COMPANY', user: { sub: 'user-1' } })
  })

  it('does not authenticate a missing token', async () => {
    auth.claims.mockResolvedValue(null)
    const { GET } = await import('@/app/api/auth/session/route')
    const response = await GET()
    expect(await response.json()).toMatchObject({ authenticated: false, accountType: null, user: null })
  })
})
