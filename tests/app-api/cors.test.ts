import { describe, expect, it } from 'vitest'

import { CORS_HEADERS, corsOptionsResponse, corsResponse } from '@/app/api/cors'

describe('api cors helpers', () => {
  it('returns options response with cors headers', () => {
    const response = corsOptionsResponse()

    expect(response.status).toBe(204)
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      expect(response.headers.get(key)).toBe(value)
    })
  })

  it('merges cors headers with custom response headers', async () => {
    const response = corsResponse('ok', { status: 201, headers: { 'Content-Type': 'text/plain' } })

    expect(response.status).toBe(201)
    expect(await response.text()).toBe('ok')
    expect(response.headers.get('Content-Type')).toBe('text/plain')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
