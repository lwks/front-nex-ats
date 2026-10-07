import { describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ claims: vi.fn() }))
vi.mock('@/lib/auth/supabase-server', () => ({ getVerifiedClaims: auth.claims }))

describe('Next API account guard', () => {
  it('rejects anonymous and wrong-type requests', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    const { accountTypeError } = await import('@/lib/auth/require-api-account-type')
    auth.claims.mockResolvedValue(null)
    expect((await accountTypeError('COMPANY'))?.status).toBe(401)
    auth.claims.mockResolvedValue({ app_metadata: { account_type: 'CANDIDATE' } })
    expect((await accountTypeError('COMPANY'))?.status).toBe(403)
  })

  it('accepts the matching verified type', async () => {
    const { accountTypeError } = await import('@/lib/auth/require-api-account-type')
    auth.claims.mockResolvedValue({ app_metadata: { account_type: 'COMPANY' } })
    expect(await accountTypeError('COMPANY')).toBeNull()
  })
})
