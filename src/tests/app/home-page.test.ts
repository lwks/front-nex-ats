import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
} from '@/lib/auth/cognito'

describe('app/page route guard', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('redirects to /api/auth/login when session is missing', async () => {
    const redirectMock = vi.fn((location: string) => {
      throw new Error(`NEXT_REDIRECT:${location}`)
    })

    vi.doMock('next/navigation', () => ({
      redirect: redirectMock,
    }))

    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      }),
      headers: vi.fn().mockResolvedValue(new Headers({
        host: 'app.example.com',
      })),
    }))

    const { default: HomePage } = await import('@/app/page')

    await expect(HomePage()).rejects.toThrow('NEXT_REDIRECT:/api/auth/login')
    expect(redirectMock).toHaveBeenCalledWith('/api/auth/login')
  })

  it('does not redirect when auth is disabled for localhost', async () => {
    const redirectMock = vi.fn()
    const pipelineMock = vi.fn(() => null)

    vi.doMock('@/components/company-applications-page', () => ({
      CompanyApplicationsPage: pipelineMock,
    }))

    vi.doMock('next/navigation', () => ({
      redirect: redirectMock,
    }))

    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      }),
      headers: vi.fn().mockResolvedValue(new Headers({
        host: 'localhost:3000',
      })),
    }))

    const { default: HomePage } = await import('@/app/page')
    const page = await HomePage()

    expect(page).toBeTruthy()
    expect(page.type).toBe(pipelineMock)
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('renders home when session is authenticated', async () => {
    const redirectMock = vi.fn()
    const expiresAt = new Date(Date.now() + 60_000).toISOString()
    const pipelineMock = vi.fn(() => null)

    vi.doMock('@/components/company-applications-page', () => ({
      CompanyApplicationsPage: pipelineMock,
    }))

    vi.doMock('next/navigation', () => ({
      redirect: redirectMock,
    }))

    vi.doMock('next/headers', () => ({
      cookies: vi.fn().mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === ACCESS_TOKEN_COOKIE) {
            return { value: 'access-token' }
          }

          if (name === ID_TOKEN_COOKIE) {
            return { value: 'id-token' }
          }

          if (name === TOKEN_EXPIRES_AT_COOKIE) {
            return { value: expiresAt }
          }

          return undefined
        }),
      }),
      headers: vi.fn().mockResolvedValue(new Headers({
        host: 'app.example.com',
      })),
    }))

    const { default: HomePage } = await import('@/app/page')
    const page = await HomePage()

    expect(page).toBeTruthy()
    expect(page.type).toBe(pipelineMock)
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
