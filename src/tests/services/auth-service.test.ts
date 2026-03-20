import { beforeEach, describe, expect, it, vi } from 'vitest'

const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'

describe('auth-service', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
    process.env.COGNITO_DOMAIN = 'https://tenant.auth.us-east-1.amazoncognito.com/'
    process.env.COGNITO_CLIENT_ID = 'client-id'
    process.env.COGNITO_REDIRECT_URI = 'http://localhost:3000/api/auth/callback'
    process.env.COGNITO_SCOPES = 'openid   profile email'
    delete process.env.COGNITO_CLIENT_SECRET
  })

  it('builds authorize URL with PKCE params', async () => {
    const { buildAuthorizeUrl } = await import('@/services/auth-service')

    const url = await buildAuthorizeUrl({
      codeChallenge: 'challenge-value',
      state: 'state-123',
    })

    const parsedUrl = new URL(url)

    expect(parsedUrl.origin).toBe('https://tenant.auth.us-east-1.amazoncognito.com')
    expect(parsedUrl.pathname).toBe('/oauth2/authorize')
    expect(parsedUrl.searchParams.get('client_id')).toBe('client-id')
    expect(parsedUrl.searchParams.get('code_challenge')).toBe('challenge-value')
    expect(parsedUrl.searchParams.get('code_challenge_method')).toBe('S256')
    expect(parsedUrl.searchParams.get('scope')).toBe('openid profile email')
  })

  it('generates RFC-compatible PKCE challenge', async () => {
    const { generateCodeChallenge } = await import('@/services/auth-service')

    await expect(generateCodeChallenge(verifier)).resolves.toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('exchanges authorization code for tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-token',
        expires_in: 3600,
        id_token: 'id-token',
        refresh_token: 'refresh-token',
        token_type: 'Bearer',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { exchangeCodeForToken } = await import('@/services/auth-service')
    const token = await exchangeCodeForToken('auth-code', 'pkce-verifier')

    expect(token.access_token).toBe('access-token')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/token')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
    const body = init.body as URLSearchParams
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('auth-code')
    expect(body.get('code_verifier')).toBe('pkce-verifier')
    expect(body.get('client_id')).toBe('client-id')
  })

  it('includes client secret and refresh token when refreshing', async () => {
    process.env.COGNITO_CLIENT_SECRET = 'super-secret'
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { refreshToken } = await import('@/services/auth-service')
    await refreshToken('refresh-token-value')

    const [, init] = fetchMock.mock.calls[0]
    const body = init.body as URLSearchParams
    expect(body.get('grant_type')).toBe('refresh_token')
    expect(body.get('refresh_token')).toBe('refresh-token-value')
    expect(body.get('client_secret')).toBe('super-secret')
  })

  it('throws a descriptive error when Cognito rejects the token request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'invalid_grant',
        error_description: 'Code mismatch',
      }),
    }))

    const { exchangeCodeForToken } = await import('@/services/auth-service')

    await expect(exchangeCodeForToken('bad-code', 'verifier')).rejects.toThrow(
      'Cognito token exchange failed (400): Code mismatch',
    )
  })
})
