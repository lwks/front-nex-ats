import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const auth = vi.hoisted(() => ({ exchange: vi.fn(), claims: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { exchangeCodeForSession: auth.exchange, getClaims: auth.claims } }) }))

describe('Supabase callback', () => {
  it('rejects a missing code', async () => {
    const { GET } = await import('@/app/auth/callback/route')
    const response = await GET(new NextRequest('http://localhost/auth/callback'))
    expect(response.headers.get('location')).toContain('/?error=callback')
  })

  it('sends a verified company to the ATS', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    auth.exchange.mockResolvedValue({ error: null })
    auth.claims.mockResolvedValue({ data: { claims: { app_metadata: { account_type: 'COMPANY' } } } })
    const { GET } = await import('@/app/auth/callback/route')
    const response = await GET(new NextRequest('http://localhost/auth/callback?code=valid'))
    expect(response.headers.get('location')).toContain('/empresa/candidaturas')
  })

  it('sends an OAuth newcomer to type selection', async () => {
    auth.exchange.mockResolvedValue({ error: null })
    auth.claims.mockResolvedValue({ data: { claims: {} } })
    const { GET } = await import('@/app/auth/callback/route')
    const response = await GET(new NextRequest('http://localhost/auth/callback?code=valid'))
    expect(response.headers.get('location')).toContain('mode=complete')
  })

  it('reports an exchange error', async () => {
    auth.exchange.mockResolvedValue({ error: { message: 'invalid code' } })
    const { GET } = await import('@/app/auth/callback/route')
    const response = await GET(new NextRequest('http://localhost/auth/callback?code=bad'))
    expect(response.headers.get('location')).toContain('error=callback')
  })
})
