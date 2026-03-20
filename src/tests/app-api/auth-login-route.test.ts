import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/auth-service', () => ({
  buildAuthorizeUrl: vi.fn(),
  generateCodeChallenge: vi.fn(),
  generateCodeVerifier: vi.fn(),
}))

describe('/api/auth/login route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('creates PKCE cookies and redirects to Cognito', async () => {
    const authService = await import('@/services/auth-service')
    vi.mocked(authService.generateCodeVerifier).mockReturnValue('generated-verifier')
    vi.mocked(authService.generateCodeChallenge).mockResolvedValue('generated-challenge')
    vi.mocked(authService.buildAuthorizeUrl).mockResolvedValue('https://tenant.auth/oauth2/authorize?state=test-state')

    const uuidSpy = vi.spyOn(await import('node:crypto'), 'randomUUID').mockReturnValue('test-state')
    const { GET } = await import('@/app/api/auth/login/route')

    const response = await GET(new Request('https://example.com/api/auth/login'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://tenant.auth/oauth2/authorize?state=test-state')
    expect(authService.buildAuthorizeUrl).toHaveBeenCalledWith({
      codeChallenge: 'generated-challenge',
      state: 'test-state',
    })
    const cookies = response.headers.get('set-cookie') ?? ''
    expect(cookies).toContain('auth_state=test-state')
    expect(cookies).toContain('auth_code_verifier=generated-verifier')
    uuidSpy.mockRestore()
  })
})
