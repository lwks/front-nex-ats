import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ claims: vi.fn() }))
vi.mock('@/lib/auth/supabase-server', () => ({ getVerifiedClaims: auth.claims }))

const originalSupabaseEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
}

function restoreEnv(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
}

describe('GET /api/auth/session', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    auth.claims.mockReset()
  })

  afterEach(() => {
    restoreEnv('NEXT_PUBLIC_SUPABASE_URL', originalSupabaseEnv.url)
    restoreEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', originalSupabaseEnv.publishableKey)
  })

  it('returns a verified account summary', async () => {
    auth.claims.mockResolvedValue({ sub: 'user-1', email: 'user@example.com', exp: 1900000000, app_metadata: { account_type: 'COMPANY' } })
    const { GET } = await import('@/app/api/auth/session/route')
    const response = await GET()
    expect(await response.json()).toMatchObject({ authEnabled: true, authenticated: true, accountType: 'COMPANY', user: { sub: 'user-1' } })
  })

  it('does not authenticate a missing token', async () => {
    auth.claims.mockResolvedValue(null)
    const { GET } = await import('@/app/api/auth/session/route')
    const response = await GET()
    expect(await response.json()).toMatchObject({ authEnabled: true, authenticated: false, accountType: null, user: null })
  })

  it.each([
    ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'public-key'],
    ['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co'],
  ])('reports auth as disabled when %s is missing', async (missingVariable, otherVariable, configuredValue) => {
    delete process.env[missingVariable]
    process.env[otherVariable] = configuredValue
    auth.claims.mockResolvedValue(null)
    const { GET } = await import('@/app/api/auth/session/route')
    const response = await GET()
    expect(await response.json()).toMatchObject({ authEnabled: false, authenticated: false })
  })
})
