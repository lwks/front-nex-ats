import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/auth-service', () => ({
  exchangeCodeForToken: vi.fn(),
}))

describe('/api/auth/callback route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('redirects to login when code or state is missing', async () => {
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(new Request('https://example.com/api/auth/callback?code=only-code'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/login?error=auth_callback_failed')
  })

  it('redirects to login when state cookie does not match', async () => {
    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      new Request('https://example.com/api/auth/callback?code=auth-code&state=expected-state', {
        headers: {
          cookie: 'auth_state=other-state; auth_code_verifier=pkce-value',
        },
      }),
    )

    expect(response.headers.get('location')).toBe('https://example.com/login?error=auth_callback_failed')
  })

  it('stores tokens in cookies and clears transient PKCE cookies', async () => {
    const authService = await import('@/services/auth-service')
    vi.mocked(authService.exchangeCodeForToken).mockResolvedValue({
      access_token: 'access-token',
      expires_in: 3600,
      id_token: 'id-token',
      refresh_token: 'refresh-token',
      token_type: 'Bearer',
    })

    const { GET } = await import('@/app/api/auth/callback/route')

    const response = await GET(
      new Request('https://example.com/api/auth/callback?code=auth-code&state=expected-state', {
        headers: {
          cookie: 'auth_state=expected-state; auth_code_verifier=pkce-value',
        },
      }),
    )

    expect(authService.exchangeCodeForToken).toHaveBeenCalledWith('auth-code', 'pkce-value')
    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://example.com/')
    const cookies = response.headers.get('set-cookie') ?? ''
    expect(cookies).toContain('auth_access_token=access-token')
    expect(cookies).toContain('auth_id_token=id-token')
    expect(cookies).toContain('auth_refresh_token=refresh-token')
    expect(cookies).toContain('auth_state=;')
    expect(cookies).toContain('auth_code_verifier=;')
  })

  it('redirects to login when token exchange fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const authService = await import('@/services/auth-service')
    vi.mocked(authService.exchangeCodeForToken).mockRejectedValue(new Error('token exchange failed'))

    const { GET } = await import('@/app/api/auth/callback/route')
    const response = await GET(
      new Request('https://example.com/api/auth/callback?code=auth-code&state=expected-state', {
        headers: {
          cookie: 'auth_state=expected-state; auth_code_verifier=pkce-value',
        },
      }),
    )

    expect(response.headers.get('location')).toBe('https://example.com/login?error=auth_callback_failed')
    expect(consoleSpy).toHaveBeenCalled()
  })
})
