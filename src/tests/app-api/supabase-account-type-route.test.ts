import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  claims: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
}))
vi.mock('@/lib/auth/supabase-server', () => ({ getVerifiedClaims: auth.claims }))
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { admin: { getUserById: auth.getUserById, updateUserById: auth.updateUserById } } }),
}))

describe('POST /api/auth/account-type', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-key'
  })

  it('requires a verified session', async () => {
    auth.claims.mockResolvedValue(null)
    const { POST } = await import('@/app/api/auth/account-type/route')
    const response = await POST(new Request('http://localhost/api/auth/account-type', { method: 'POST' }))
    expect(response.status).toBe(401)
    expect(auth.updateUserById).not.toHaveBeenCalled()
  })

  it('persists a first choice in server-controlled metadata', async () => {
    auth.claims.mockResolvedValue({ sub: 'user-1', user_metadata: { account_type: 'COMPANY' } })
    auth.getUserById.mockResolvedValue({ data: { user: { app_metadata: { provider: 'email' } } }, error: null })
    auth.updateUserById.mockResolvedValue({ error: null })
    const { POST } = await import('@/app/api/auth/account-type/route')
    const response = await POST(new Request('http://localhost/api/auth/account-type', { method: 'POST', body: '{}' }))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ accountType: 'COMPANY', destination: '/empresa/candidaturas' })
    expect(auth.updateUserById).toHaveBeenCalledWith('user-1', { app_metadata: { provider: 'email', account_type: 'COMPANY' } })
  })

  it('does not allow a later role change', async () => {
    auth.claims.mockResolvedValue({ sub: 'user-1', app_metadata: { account_type: 'CANDIDATE' } })
    const { POST } = await import('@/app/api/auth/account-type/route')
    const response = await POST(new Request('http://localhost/api/auth/account-type', { method: 'POST', body: JSON.stringify({ accountType: 'COMPANY' }) }))
    expect(await response.json()).toMatchObject({ accountType: 'CANDIDATE' })
    expect(auth.updateUserById).not.toHaveBeenCalled()
  })

  it('reports administration failures without granting access', async () => {
    auth.claims.mockResolvedValue({ sub: 'user-1' })
    auth.getUserById.mockResolvedValue({ data: { user: { app_metadata: {} } }, error: null })
    auth.updateUserById.mockResolvedValue({ error: { message: 'denied' } })
    const { POST } = await import('@/app/api/auth/account-type/route')
    const response = await POST(new Request('http://localhost/api/auth/account-type', { method: 'POST', body: JSON.stringify({ accountType: 'COMPANY' }) }))
    expect(response.status).toBe(502)
  })

  it('handles an administration request that throws', async () => {
    auth.claims.mockResolvedValue({ sub: 'user-1' })
    auth.getUserById.mockRejectedValue(new Error('network down'))
    const { POST } = await import('@/app/api/auth/account-type/route')
    const response = await POST(new Request('http://localhost/api/auth/account-type', { method: 'POST', body: JSON.stringify({ accountType: 'COMPANY' }) }))
    expect(response.status).toBe(502)
    expect(auth.updateUserById).not.toHaveBeenCalled()
  })
})
