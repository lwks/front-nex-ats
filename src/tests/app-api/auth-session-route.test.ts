import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { ACCESS_TOKEN_COOKIE, ID_TOKEN_COOKIE, TOKEN_EXPIRES_AT_COOKIE } from '@/lib/auth/cognito'

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.signature`
}

describe('/api/auth/session route', () => {
  it('returns an authenticated session summary', async () => {
    const idToken = createJwt({ sub: 'user-123', email: 'person@example.com', name: 'Ada Lovelace' })
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const { GET } = await import('@/app/api/auth/session/route')

    const response = await GET(new NextRequest('https://app.example.com/api/auth/session', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=access-token; ${ID_TOKEN_COOKIE}=${idToken}; ${TOKEN_EXPIRES_AT_COOKIE}=${expiresAt}`,
      },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      expiresAt,
      user: {
        sub: 'user-123',
        email: 'person@example.com',
        name: 'Ada Lovelace',
      },
    })
  })

  it('returns anonymous session when auth cookies are missing', async () => {
    const { GET } = await import('@/app/api/auth/session/route')
    const response = await GET(new NextRequest('http://localhost/api/auth/session'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      authenticated: false,
      expiresAt: null,
      user: null,
    })
  })

  it('returns anonymous session when the token is expired', async () => {
    const idToken = createJwt({ sub: 'user-123' })
    const expiresAt = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { GET } = await import('@/app/api/auth/session/route')

    const response = await GET(new NextRequest('http://localhost/api/auth/session', {
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE}=access-token; ${ID_TOKEN_COOKIE}=${idToken}; ${TOKEN_EXPIRES_AT_COOKIE}=${expiresAt}`,
      },
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      authenticated: false,
      expiresAt,
      user: null,
    })
  })
})
