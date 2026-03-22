import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTH_CODE_VERIFIER_COOKIE, AUTH_STATE_COOKIE } from '@/lib/auth/cognito'

function getSetCookieHeader(response: Response) {
  return response.headers.get('set-cookie') ?? ''
}

describe('/api/auth/login route', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.COGNITO_CLIENT_ID = 'client-id'
    delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    delete process.env.COGNITO_REDIRECT_URI
    delete process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI
  })

  it('creates PKCE cookies and redirects to Cognito', async () => {
    const { GET } = await import('@/app/api/auth/login/route')

    const response = await GET(new NextRequest('https://example.com/api/auth/login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com/oauth2/authorize?')
    expect(response.headers.get('location')).toContain('client_id=client-id')
    expect(response.headers.get('location')).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fauth%2Fcallback')

    const cookies = getSetCookieHeader(response)
    expect(cookies).toContain(`${AUTH_STATE_COOKIE}=`)
    expect(cookies).toContain(`${AUTH_CODE_VERIFIER_COOKIE}=`)
    expect(cookies).toContain('HttpOnly')
    expect(cookies).toContain('Secure')
    expect(cookies).toContain('SameSite=Lax')
    expect(cookies).toContain('Path=/')
    expect(cookies).toContain('Max-Age=600')
  })

  it('returns 500 when client id is missing', async () => {
    delete process.env.COGNITO_CLIENT_ID

    const { GET } = await import('@/app/api/auth/login/route')
    const response = await GET(new NextRequest('http://localhost/api/auth/login'))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ message: 'COGNITO_CLIENT_ID não configurado.' })
  })
})
