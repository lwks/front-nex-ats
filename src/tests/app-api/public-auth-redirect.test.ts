import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const signOut = vi.fn().mockResolvedValue({ error: null })
vi.mock('@/lib/auth/supabase-server', () => ({ createSupabaseServerClient: async () => ({ auth: { signOut } }) }))

describe('public auth redirects behind a proxy', () => {
  it('ends the session and redirects to the forwarded public host', async () => {
    const { GET } = await import('@/app/api/auth/logout/route')
    const request = new NextRequest('http://0.0.0.0:3000/api/auth/logout', {
      headers: { host: '0.0.0.0:3000', 'x-forwarded-host': 'clusterjobs.com.br', 'x-forwarded-proto': 'https' },
    })
    const response = await GET(request)
    expect(signOut).toHaveBeenCalledOnce()
    expect(response.headers.get('location')).toBe('https://clusterjobs.com.br/')
  })

  it('uses the public Host header and ignores unknown forwarded hosts', async () => {
    const { publicRedirectUrl } = await import('@/lib/auth/public-redirect')
    const request = new NextRequest('http://0.0.0.0:3000/auth/callback', {
      headers: { host: 'www.clusterjobs.com.br', 'x-forwarded-host': 'untrusted.example' },
    })
    expect(publicRedirectUrl(request, '/?error=callback').href).toBe('https://www.clusterjobs.com.br/?error=callback')
  })

  it('keeps local redirects on the local origin', async () => {
    const { publicRedirectUrl } = await import('@/lib/auth/public-redirect')
    expect(publicRedirectUrl(new NextRequest('http://localhost:3000/api/auth/login'), '/').href).toBe('http://localhost:3000/')
  })

  it('never redirects to the internal bind address when proxy headers are absent', async () => {
    const { publicRedirectUrl } = await import('@/lib/auth/public-redirect')
    expect(publicRedirectUrl(new NextRequest('http://0.0.0.0:3000/api/auth/logout'), '/').href).toBe('https://clusterjobs.com.br/')
  })
})
