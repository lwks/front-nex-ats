import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
} from '@/lib/auth/cognito'

function getSetCookieHeader(response: Response) {
  return response.headers.get('set-cookie') ?? ''
}

describe('/api/auth/refresh route', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.COGNITO_CLIENT_ID = 'client-id'
    process.env.COGNITO_DOMAIN = 'https://tenant.auth.us-east-1.amazoncognito.com'
  })

  it('refreshes the session with a valid refresh token', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        id_token: 'new-id-token',
        refresh_token: 'new-refresh-token',
        expires_in: 1800,
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { POST } = await import('@/app/api/auth/refresh/route')
    const response = await POST(new NextRequest('https://app.example.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE}=refresh-token; ${ID_TOKEN_COOKIE}=previous-id-token`,
      },
    }))

    expect(fetchSpy).toHaveBeenCalledWith('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'client-id',
        refresh_token: 'refresh-token',
      }).toString(),
      cache: 'no-store',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ authenticated: true })

    const setCookieHeader = getSetCookieHeader(response)
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=new-access-token`)
    expect(setCookieHeader).toContain(`${ID_TOKEN_COOKIE}=new-id-token`)
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=new-refresh-token`)
    expect(setCookieHeader).toContain(`${TOKEN_EXPIRES_AT_COOKIE}=`)
    expect(setCookieHeader).toContain('Max-Age=1800')
  })

  it('returns 401 when the refresh token cookie is missing', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const { POST } = await import('@/app/api/auth/refresh/route')
    const response = await POST(new NextRequest('http://localhost/api/auth/refresh', { method: 'POST' }))

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ authenticated: false, message: 'Refresh token ausente.' })
  })

  it('cleans session cookies and returns 401 when Cognito rejects the refresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'invalid_grant' }),
      }),
    )

    const { POST } = await import('@/app/api/auth/refresh/route')
    const response = await POST(new NextRequest('https://app.example.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE}=expired-refresh-token`,
      },
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({
      authenticated: false,
      message: 'Não foi possível renovar a sessão.',
    })

    const setCookieHeader = getSetCookieHeader(response)
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${ID_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${TOKEN_EXPIRES_AT_COOKIE}=;`)
  })
  it('returns 502 and clears cookies when Cognito is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { POST } = await import('@/app/api/auth/refresh/route')
    const response = await POST(new NextRequest('https://app.example.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE}=refresh-token`,
      },
    }))

    expect(consoleSpy).toHaveBeenCalled()
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      authenticated: false,
      message: 'Falha ao comunicar com o Cognito.',
    })

    const setCookieHeader = getSetCookieHeader(response)
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${ID_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=;`)
    expect(setCookieHeader).toContain(`${TOKEN_EXPIRES_AT_COOKIE}=;`)
  })

  it('sends basic auth header when COGNITO_CLIENT_SECRET is configured', async () => {
    process.env.COGNITO_CLIENT_SECRET = 'secret-123'
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        id_token: 'new-id-token',
        expires_in: 1800,
      }),
    })
    vi.stubGlobal('fetch', fetchSpy)

    const { POST } = await import('@/app/api/auth/refresh/route')
    await POST(new NextRequest('https://app.example.com/api/auth/refresh', {
      method: 'POST',
      headers: {
        cookie: `${REFRESH_TOKEN_COOKIE}=refresh-token; ${ID_TOKEN_COOKIE}=previous-id-token`,
      },
    }))

    expect(fetchSpy).toHaveBeenCalledWith('https://tenant.auth.us-east-1.amazoncognito.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic Y2xpZW50LWlkOnNlY3JldC0xMjM=',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'client-id',
        refresh_token: 'refresh-token',
      }).toString(),
      cache: 'no-store',
    })
  })

})
