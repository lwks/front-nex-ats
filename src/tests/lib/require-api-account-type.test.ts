import { describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ getSession: vi.fn(), getClaims: vi.fn() }))
vi.mock('@/lib/auth/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth })),
}))

describe('Next API account guard', () => {
  it('rejects anonymous requests', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    const { authorizeApiAccountType } = await import('@/lib/auth/require-api-account-type')
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null })

    const result = await authorizeApiAccountType('COMPANY')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('rejects an authenticated account with the wrong type', async () => {
    const { authorizeApiAccountType } = await import('@/lib/auth/require-api-account-type')
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'candidate-token' } }, error: null })
    auth.getClaims.mockResolvedValue({ data: { claims: { app_metadata: { account_type: 'CANDIDATE' } } }, error: null })

    const result = await authorizeApiAccountType('COMPANY')

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('returns the exact verified access token for the matching account type', async () => {
    const { authorizeApiAccountType } = await import('@/lib/auth/require-api-account-type')
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'company-token' } }, error: null })
    auth.getClaims.mockResolvedValue({ data: { claims: { app_metadata: { account_type: 'COMPANY' } } }, error: null })

    const result = await authorizeApiAccountType('COMPANY')

    expect(auth.getClaims).toHaveBeenCalledWith('company-token')
    expect(result).toEqual({ ok: true, accessToken: 'company-token' })
  })
})
