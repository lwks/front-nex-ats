import { NextRequest } from 'next/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ACCESS_TOKEN_COOKIE,
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_STATE_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
} from '@/lib/auth/cognito'

function getSetCookieHeader(response: Response) {
  return response.headers.get('set-cookie') ?? ''
}

describe('/api/auth/callback route', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = {
      ...originalEnv,
      COGNITO_CLIENT_ID: 'client-id',
      COGNITO_DOMAIN: 'https://tenant.auth.us-east-1.amazoncognito.com',
    }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('troca o authorization code por tokens, persiste cookies seguros e redireciona para a home', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        id_token: 'id-token',
        expires_in: 3600,
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { GET } = await import('@/app/api/auth/callback/route')
    const request = new NextRequest('https://app.example.com/api/auth/callback?code=valid-code&state=expected-state', {
      headers: {
        cookie: `${AUTH_STATE_COOKIE}=expected-state; ${AUTH_CODE_VERIFIER_COOKIE}=code-verifier-value`,
      },
    })

    const response = await GET(request as never)

    expect(fetchSpy).toHaveBeenCalledWith('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'client-id',
        code: 'valid-code',
        redirect_uri: 'https://app.example.com/api/auth/callback',
        code_verifier: 'code-verifier-value',
      }).toString(),
      cache: 'no-store',
    })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.example.com/')

    const setCookieHeader = getSetCookieHeader(response)
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=access-token`)
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=refresh-token`)
    expect(setCookieHeader).toContain(`${ID_TOKEN_COOKIE}=id-token`)
    expect(setCookieHeader).toContain(`${AUTH_STATE_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CODE_VERIFIER_COOKIE}=;`)
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('Secure')
    expect(setCookieHeader).toContain('SameSite=lax')
    expect(setCookieHeader).toContain('Path=/')
    expect(setCookieHeader).toContain('Max-Age=3600')
    expect(setCookieHeader).toContain(`${TOKEN_EXPIRES_AT_COOKIE}=`)
  })

  it('returns 400 when state does not match', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { GET } = await import('@/app/api/auth/callback/route')

    const request = new NextRequest('https://app.example.com/api/auth/callback?code=valid-code&state=unexpected-state', {
      headers: {
        cookie: `${AUTH_STATE_COOKIE}=expected-state; ${AUTH_CODE_VERIFIER_COOKIE}=code-verifier-value`,
      },
    })

    const response = await GET(request as never)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ message: 'State inválido ou expirado.' })
  })

  it('cleans auth cookies when Cognito returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' }),
      }),
    )

    const { GET } = await import('@/app/api/auth/callback/route')
    const request = new NextRequest('https://app.example.com/api/auth/callback?code=valid-code&state=expected-state', {
      headers: {
        cookie: `${AUTH_STATE_COOKIE}=expected-state; ${AUTH_CODE_VERIFIER_COOKIE}=code-verifier-value`,
      },
    })

    const response = await GET(request as never)
    const setCookieHeader = getSetCookieHeader(response)

    expect(response.status).toBe(400)
    expect(setCookieHeader).toContain(`${AUTH_STATE_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CODE_VERIFIER_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${ID_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${TOKEN_EXPIRES_AT_COOKIE}=;`)
    expect(setCookieHeader).toContain('Max-Age=0')
  })

  it('sends basic auth header when COGNITO_CLIENT_SECRET is configured', async () => {
    process.env.COGNITO_CLIENT_SECRET = 'secret-123'
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-token',
        id_token: 'id-token',
        expires_in: 3600,
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { GET } = await import('@/app/api/auth/callback/route')
    const request = new NextRequest('https://app.example.com/api/auth/callback?code=valid-code&state=expected-state', {
      headers: {
        cookie: `${AUTH_STATE_COOKIE}=expected-state; ${AUTH_CODE_VERIFIER_COOKIE}=code-verifier-value`,
      },
    })

    await GET(request as never)

    expect(fetchSpy).toHaveBeenCalledWith('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic Y2xpZW50LWlkOnNlY3JldC0xMjM=',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'client-id',
        code: 'valid-code',
        redirect_uri: 'https://app.example.com/api/auth/callback',
        code_verifier: 'code-verifier-value',
      }).toString(),
      cache: 'no-store',
    })
  })
})
