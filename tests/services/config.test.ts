import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('config API urls', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.NEXT_PUBLIC_API_BASE_URL
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
})
