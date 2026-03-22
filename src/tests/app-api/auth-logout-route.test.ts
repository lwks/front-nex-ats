import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it } from 'vitest'

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

describe('/api/auth/logout route', () => {
  beforeEach(() => {
    process.env.COGNITO_CLIENT_ID = 'client-id'
    delete process.env.COGNITO_LOGOUT_URI
    delete process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI
  })

  it('cleans every auth cookie and redirects locally when hosted ui logout is not configured', async () => {
    const { GET } = await import('@/app/api/auth/logout/route')

    const response = await GET(new NextRequest('https://app.example.com/api/auth/logout'))
    const setCookieHeader = getSetCookieHeader(response)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://app.example.com/')
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${ID_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${TOKEN_EXPIRES_AT_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${AUTH_STATE_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${AUTH_CODE_VERIFIER_COOKIE}=;`)
    expect(setCookieHeader).toContain('Max-Age=0')
  })

  it('redirects to Cognito hosted ui logout when configured', async () => {
    process.env.COGNITO_LOGOUT_URI = 'https://app.example.com/logout-complete'
    process.env.COGNITO_DOMAIN = 'https://tenant.auth.us-east-1.amazoncognito.com'

    const { GET } = await import('@/app/api/auth/logout/route')
    const response = await GET(new NextRequest('https://app.example.com/api/auth/logout'))

    expect(response.headers.get('location')).toBe(
      'https://tenant.auth.us-east-1.amazoncognito.com/logout?client_id=client-id&logout_uri=https%3A%2F%2Fapp.example.com%2Flogout-complete',
    )
  })
})
