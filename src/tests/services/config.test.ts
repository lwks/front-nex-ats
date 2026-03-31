import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('config API urls', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_API_BASE_URL
    delete process.env.COGNITO_DOMAIN
    delete process.env.COGNITO_CLIENT_ID
    delete process.env.COGNITO_REDIRECT_URI
    delete process.env.COGNITO_SCOPES
  })

  it('uses default base URL when env var is not provided', async () => {
    const config = await import('@/config')

    expect(config.API_BASE_URL).toContain('lambda-url')
    expect(config.CANDIDATES_API_URL.endsWith('/candidates')).toBe(true)
  })

  it('sanitizes env base URL by removing query string and trailing slash', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.company.com/base/?foo=bar'
    const config = await import('@/config')

    expect(config.API_BASE_URL).toBe('https://api.company.com/base')
    expect(config.JOBS_API_URL).toBe('https://api.company.com/base/jobs')
  })

  it('exposes sanitized Cognito configuration', async () => {
    process.env.COGNITO_DOMAIN = 'https://tenant.auth.us-east-1.amazoncognito.com/'
    process.env.COGNITO_CLIENT_ID = 'client-id'
    process.env.COGNITO_REDIRECT_URI = 'http://localhost:3000/api/auth/callback'
    process.env.COGNITO_SCOPES = 'openid   profile   email'

    const config = await import('@/config')

    expect(config.COGNITO_DOMAIN).toBe('https://tenant.auth.us-east-1.amazoncognito.com')
    expect(config.COGNITO_AUTHORIZE_URL).toBe('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/authorize')
    expect(config.COGNITO_TOKEN_URL).toBe('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/token')
    expect(config.COGNITO_SCOPES).toBe('openid profile email')
  })
})
