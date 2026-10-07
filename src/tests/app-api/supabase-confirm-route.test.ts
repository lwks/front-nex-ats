import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const auth = vi.hoisted(() => ({ verify: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { verifyOtp: auth.verify } }) }))

describe('Supabase email confirmation', () => {
  it('rejects an invalid link', async () => {
    const { GET } = await import('@/app/auth/confirm/route')
    const response = await GET(new NextRequest('http://localhost/auth/confirm?type=email'))
    expect(response.headers.get('location')).toContain('error=confirmation')
  })

  it('verifies a recovery token and opens password update', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'public-key'
    auth.verify.mockResolvedValue({ error: null })
    const { GET } = await import('@/app/auth/confirm/route')
    const response = await GET(new NextRequest('http://localhost/auth/confirm?token_hash=hash&type=recovery'))
    expect(auth.verify).toHaveBeenCalledWith({ token_hash: 'hash', type: 'recovery' })
    expect(response.headers.get('location')).toContain('mode=recover')
  })

  it('reports a rejected token', async () => {
    auth.verify.mockResolvedValue({ error: { message: 'expired' } })
    const { GET } = await import('@/app/auth/confirm/route')
    const response = await GET(new NextRequest('http://localhost/auth/confirm?token_hash=expired&type=email'))
    expect(response.headers.get('location')).toContain('error=confirmation')
  })
})
