import { describe, expect, it } from 'vitest'

import {
  ACCESS_TOKEN_COOKIE,
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_STATE_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
  buildLogoutUrl,
  clearAllAuthCookies,
  getSessionState,
  getUserFromIdToken,
  isTokenExpired,
  setSessionCookies,
} from '@/lib/auth/cognito'

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.signature`
}

describe('lib/auth/cognito helpers', () => {
  it('builds a Cognito logout url', () => {
    expect(buildLogoutUrl({
      cognitoDomain: 'https://tenant.auth.us-east-1.amazoncognito.com',
      clientId: 'client-id',
      logoutUri: 'https://app.example.com/',
    })).toBe(
      'https://tenant.auth.us-east-1.amazoncognito.com/logout?client_id=client-id&logout_uri=https%3A%2F%2Fapp.example.com%2F',
    )
  })

  it('sets and clears session cookies consistently', () => {
    const response = new Response(null, { headers: new Headers() }) as Response & {
      cookies: { set: (name: string, value: string, options?: Record<string, unknown>) => void }
    }
    const cookieStore = new Map<string, { value: string, options?: Record<string, unknown> }>()
    response.cookies = {
      set: (name, value, options) => {
        cookieStore.set(name, { value, options })
      },
    }

    const expiresAt = setSessionCookies(response, true, {
      access_token: 'access-token',
      id_token: 'id-token',
      refresh_token: 'refresh-token',
      expires_in: 900,
    })

    expect(expiresAt).toMatch(/T.*Z$/)
    expect(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value).toBe('access-token')
    expect(cookieStore.get(ID_TOKEN_COOKIE)?.value).toBe('id-token')
    expect(cookieStore.get(REFRESH_TOKEN_COOKIE)?.value).toBe('refresh-token')
    expect(cookieStore.get(TOKEN_EXPIRES_AT_COOKIE)?.value).toBe(expiresAt)

    clearAllAuthCookies(response, true)

    expect(cookieStore.get(ACCESS_TOKEN_COOKIE)?.options?.maxAge).toBe(0)
    expect(cookieStore.get(ID_TOKEN_COOKIE)?.options?.maxAge).toBe(0)
    expect(cookieStore.get(REFRESH_TOKEN_COOKIE)?.options?.maxAge).toBe(0)
    expect(cookieStore.get(TOKEN_EXPIRES_AT_COOKIE)?.options?.maxAge).toBe(0)
    expect(cookieStore.get(AUTH_STATE_COOKIE)?.options?.maxAge).toBe(0)
    expect(cookieStore.get(AUTH_CODE_VERIFIER_COOKIE)?.options?.maxAge).toBe(0)
  })

  it('reads id token claims defensively and evaluates session state', () => {
    const token = createJwt({ sub: 'user-1', email: 'user@example.com', name: 'Grace Hopper' })
    const expiresAt = new Date(Date.now() + 60_000).toISOString()

    expect(getUserFromIdToken(token)).toEqual({
      sub: 'user-1',
      email: 'user@example.com',
      name: 'Grace Hopper',
    })
    expect(getUserFromIdToken('invalid-token')).toBeNull()
    expect(isTokenExpired(expiresAt)).toBe(false)
    expect(isTokenExpired(new Date(Date.now() - 60_000).toISOString())).toBe(true)
    expect(getSessionState({ accessToken: 'access', idToken: token, expiresAt })).toEqual({
      authenticated: true,
      expiresAt,
      user: {
        sub: 'user-1',
        email: 'user@example.com',
        name: 'Grace Hopper',
      },
    })
    expect(getSessionState({ accessToken: 'access', idToken: token, expiresAt: 'not-a-date' })).toEqual({
      authenticated: false,
      expiresAt: 'not-a-date',
      user: null,
    })
  })
})
