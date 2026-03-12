import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  extractAuthProfile,
  hasValidSession,
  isTokenExpired,
  parseAuthCallbackParams,
  parseJwtPayload,
} from '@/lib/auth/cognito'

function createJwt(payload: Record<string, unknown>) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${header}.${body}.signature`
}

describe('cognito auth helpers', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('builds authorize url with secure default response_type=code', () => {
    const url = buildAuthorizeUrl(
      {
        domain: 'my-domain.auth.us-east-1.amazoncognito.com',
        clientId: 'abc123',
        redirectUri: 'http://localhost:3000/auth/callback',
      },
      { state: 'state-1', nonce: 'nonce-1' },
    )

    expect(url).toContain('https://my-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize?')
    expect(url).toContain('client_id=abc123')
    expect(url).toContain('response_type=code')
    expect(url).toContain('nonce=nonce-1')
  })

  it('throws when authorize config is incomplete', () => {
    expect(() => buildAuthorizeUrl({ domain: 'https://domain' }, { state: 'x' })).toThrow(/Configuração do Cognito/)
  })

  it('builds logout url when config is complete', () => {
    const url = buildLogoutUrl({
      domain: 'https://my-domain.auth.us-east-1.amazoncognito.com',
      clientId: 'abc123',
      logoutUri: 'http://localhost:3000',
    })

    expect(url).toContain('/logout?')
    expect(url).toContain('logout_uri=http%3A%2F%2Flocalhost%3A3000')
  })

  it('returns null for incomplete logout config', () => {
    expect(buildLogoutUrl({ domain: 'https://domain' })).toBeNull()
  })

  it('parses callback query and validates expiration and profiles', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const exp = Math.floor(Date.now() / 1000) + 3600
    const idToken = createJwt({
      sub: 'user-123',
      email: 'dev@nexjob.com',
      'cognito:username': 'dev-user',
      'cognito:groups': ['admin', 'recruiter'],
      exp,
    })

    const profile = extractAuthProfile(idToken)
    expect(profile.availableProfiles).toEqual(['admin', 'recruiter'])
    expect(profile.email).toBe('dev@nexjob.com')

    expect(isTokenExpired(idToken, Date.now())).toBe(false)
    expect(
      hasValidSession(
        {
          accessToken: 'token',
          idToken,
          expiresAt: Date.now() + 3600 * 1000,
        },
        Date.now(),
      ),
    ).toBe(true)

    expect(parseAuthCallbackParams('?code=abc&state=xyz')).toEqual({
      code: 'abc',
      state: 'xyz',
      error: undefined,
      errorDescription: undefined,
    })
  })

  it('returns null for invalid jwt payloads', () => {
    expect(parseJwtPayload('invalid-token')).toBeNull()
  })
})
