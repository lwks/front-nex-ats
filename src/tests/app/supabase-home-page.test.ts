import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ claims: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`) }) }))
vi.mock('@/lib/auth/supabase-server', () => ({ getVerifiedClaims: auth.claims }))
vi.mock('next/navigation', () => ({ redirect: auth.redirect }))
vi.mock('@/components/login-page', () => ({ LoginPage: () => null }))

describe('home login', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows login to an anonymous visitor', async () => {
    auth.claims.mockResolvedValue(null)
    const { default: HomePage } = await import('@/app/page')
    const page = await HomePage({ searchParams: Promise.resolve({}) })
    expect(page).toBeTruthy()
  })

  it('redirects each authenticated type', async () => {
    const { default: HomePage } = await import('@/app/page')
    auth.claims.mockResolvedValue({ app_metadata: { account_type: 'CANDIDATE' } })
    await expect(HomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('REDIRECT:/jobs/list')
    auth.claims.mockResolvedValue({ app_metadata: { account_type: 'COMPANY' } })
    await expect(HomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('REDIRECT:/empresa/candidaturas')
  })

  it('keeps the password recovery page available to a signed-in user', async () => {
    auth.claims.mockResolvedValue({ app_metadata: { account_type: 'COMPANY' } })
    const { default: HomePage } = await import('@/app/page')
    expect(await HomePage({ searchParams: Promise.resolve({ mode: 'recover' }) })).toBeTruthy()
  })

  it('asks an authenticated account without a type to finish registration', async () => {
    auth.claims.mockResolvedValue({ sub: 'user-1', app_metadata: {} })
    const { default: HomePage } = await import('@/app/page')
    await expect(HomePage({ searchParams: Promise.resolve({}) })).rejects.toThrow('REDIRECT:/?mode=complete')
  })
})
