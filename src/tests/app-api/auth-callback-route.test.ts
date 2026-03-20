import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTH_CALLBACK_COOKIE_NAMES, GET } from '@/app/api/auth/callback/route'

describe('/api/auth/callback route', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.AUTH_BASE_URL = 'https://auth.example.com/'
    process.env.AUTH_CLIENT_ID = 'client-id'
    process.env.AUTH_CLIENT_SECRET = 'client-secret'
    process.env.AUTH_SUCCESS_REDIRECT_PATH = '/'
    process.env.AUTH_ERROR_REDIRECT_PATH = '/login'
    delete process.env.AUTH_REDIRECT_URI
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('troca o authorization code por tokens, persiste cookies seguros e redireciona para a home', async () => {
    const fetchSpy = vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          id_token: 'id-token',
          expires_in: 3600,
          refresh_expires_in: 7200,
        }),
      }),
    )

    const request = new Request('https://app.example.com/api/auth/callback?code=valid-code&state=expected-state', {
      headers: {
        cookie: `${AUTH_CALLBACK_COOKIE_NAMES.state}=expected-state; ${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=code-verifier-value`,
      },
    })

    const response = await GET(request)

    expect(fetchSpy).toHaveBeenCalledWith('https://auth.example.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: 'client-id',
        client_secret: 'client-secret',
        code: 'valid-code',
        redirect_uri: 'https://app.example.com/api/auth/callback',
        code_verifier: 'code-verifier-value',
      }).toString(),
      cache: 'no-store',
    })
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.example.com/')

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.accessToken}=access-token`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.refreshToken}=refresh-token`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.idToken}=id-token`)
    expect(setCookieHeader).toContain('HttpOnly')
    expect(setCookieHeader).toContain('Secure')
    expect(setCookieHeader).toContain('SameSite=Lax')
    expect(setCookieHeader).toContain('Path=/')
    expect(setCookieHeader).toContain('Max-Age=3600')
    expect(setCookieHeader).toContain('Max-Age=7200')
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.state}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=;`)
  })

  it('limpa cookies e redireciona com mensagem amigável quando o state não confere', async () => {
    const fetchSpy = vi.stubGlobal('fetch', vi.fn())

    const request = new Request('https://app.example.com/api/auth/callback?code=valid-code&state=unexpected-state', {
      headers: {
        cookie: `${AUTH_CALLBACK_COOKIE_NAMES.state}=expected-state; ${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=code-verifier-value`,
      },
    })

    const response = await GET(request)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://app.example.com/login?message=A+valida%C3%A7%C3%A3o+de+seguran%C3%A7a+do+login+falhou.+Fa%C3%A7a+login+novamente.',
    )

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.state}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.accessToken}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.refreshToken}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.idToken}=;`)
    expect(setCookieHeader).toContain('Max-Age=0')
  })


  it('redireciona com mensagem amigável quando o provedor retorna error na callback', async () => {
    const fetchSpy = vi.stubGlobal('fetch', vi.fn())

    const request = new Request(
      'https://app.example.com/api/auth/callback?error=access_denied&error_description=Usu%C3%A1rio+cancelou+o+login',
      {
        headers: {
          cookie: `${AUTH_CALLBACK_COOKIE_NAMES.state}=expected-state; ${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=code-verifier-value`,
        },
      },
    )

    const response = await GET(request)

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://app.example.com/login?message=Usu%C3%A1rio+cancelou+o+login',
    )
  })

  it('limpa cookies transitórios e redireciona para login quando o provedor devolve erro', async () => {
    const fetchSpy = vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'invalid_grant',
      }),
    )
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const request = new Request('https://app.example.com/api/auth/callback?code=valid-code&state=expected-state', {
      headers: {
        cookie: `${AUTH_CALLBACK_COOKIE_NAMES.state}=expected-state; ${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=code-verifier-value`,
      },
    })

    const response = await GET(request)

    expect(fetchSpy).toHaveBeenCalledOnce()
    expect(consoleSpy).toHaveBeenCalled()
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://app.example.com/login?message=N%C3%A3o+foi+poss%C3%ADvel+concluir+o+login+agora.+Tente+novamente.',
    )

    const setCookieHeader = response.headers.get('set-cookie')
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.state}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CALLBACK_COOKIE_NAMES.codeVerifier}=;`)
  })
})
