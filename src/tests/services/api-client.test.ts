import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('api-client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('builds URL and merges default json headers', async () => {
    vi.doMock('@/config', () => ({ API_BASE_URL: 'https://example.com/api/' }))
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) })
    vi.stubGlobal('fetch', fetchMock)

    const { apiFetch } = await import('@/services/api-client')

    const response = await apiFetch('/jobs', { method: 'GET', headers: { Authorization: 'Bearer token' } })

    expect(response).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith('https://example.com/api/jobs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
      },
    })
  })

  it('throws on non-ok response with body text', async () => {
    vi.doMock('@/config', () => ({ API_BASE_URL: 'https://example.com/api' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Error', text: async () => 'failed' }))

    const { apiFetch } = await import('@/services/api-client')

    await expect(apiFetch('/jobs')).rejects.toThrow('API request failed (500): failed')
  })

  it('returns undefined for 204 responses', async () => {
    vi.doMock('@/config', () => ({ API_BASE_URL: 'https://example.com/api' }))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }))

    const { apiFetch } = await import('@/services/api-client')

    await expect(apiFetch('/jobs')).resolves.toBeUndefined()
  })

  it('returns fallback when API is not configured', async () => {
    vi.doMock('@/config', () => ({ API_BASE_URL: undefined }))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { apiFetchWithFallback } = await import('@/services/api-client')

    const fallback = [{ id: 1 }]
    const result = await apiFetchWithFallback('/jobs', fallback)

    expect(result).toEqual(fallback)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns fallback when API request fails', async () => {
    vi.doMock('@/config', () => ({ API_BASE_URL: 'https://example.com/api' }))
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { apiFetchWithFallback } = await import('@/services/api-client')

    const fallback = [{ id: 2 }]
    const result = await apiFetchWithFallback('/jobs', fallback)

    expect(result).toEqual(fallback)
    expect(consoleSpy).toHaveBeenCalled()
  })
})
