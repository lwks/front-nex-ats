import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  extractAuthProfile,
  hasValidSession,
  parseJwtPayload,
  parseTokensFromHash,
  isTokenExpired,
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

  it('builds authorize url with defaults', () => {
    const url = buildAuthorizeUrl(
      {
        domain: 'my-domain.auth.us-east-1.amazoncognito.com',
        clientId: 'abc123',
        redirectUri: 'http://localhost:3000/auth/callback',
      },
      'state-1',
    )

    expect(url).toContain('https://my-domain.auth.us-east-1.amazoncognito.com/oauth2/authorize?')
    expect(url).toContain('client_id=abc123')
    expect(url).toContain('response_type=token')
  })

  it('throws when authorize config is incomplete', () => {
    expect(() => buildAuthorizeUrl({ domain: 'https://domain' }, 'state')).toThrow(/Configuração do Cognito/)
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

  it('parses token hash and validates expiration and profiles', () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const exp = Math.floor(Date.now() / 1000) + 3600
    const idToken = createJwt({
      sub: 'user-123',
      email: 'dev@nexjob.com',
      'cognito:username': 'dev-user',
      'cognito:groups': ['admin', 'recruiter'],
      exp,
    })

    const parsed = parseTokensFromHash(`#access_token=aaa&id_token=${idToken}&expires_in=3600&token_type=Bearer`)
    expect(parsed).not.toBeNull()

    const profile = extractAuthProfile(parsed?.idToken)
    expect(profile.availableProfiles).toEqual(['admin', 'recruiter'])
    expect(profile.email).toBe('dev@nexjob.com')

    expect(isTokenExpired(idToken, Date.now())).toBe(false)
    expect(hasValidSession(parsed, Date.now())).toBe(true)
  })

  it('returns null for invalid jwt payloads and invalid hash', () => {
    expect(parseJwtPayload('invalid-token')).toBeNull()
    expect(parseTokensFromHash('#foo=bar')).toBeNull()
  })
})
