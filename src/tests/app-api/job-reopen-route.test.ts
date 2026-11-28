import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/jobs/[id]/reopen/route'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'

vi.mock('@/lib/auth/require-api-account-type', () => ({ authorizeApiAccountType: vi.fn() }))
const auth = vi.mocked(authorizeApiAccountType)
const context = { params: Promise.resolve({ id: 'job one' }) }
const request = (body: unknown) => new Request('http://localhost/api/jobs/job/reopen', { method: 'POST', body: JSON.stringify(body) })
beforeEach(() => { auth.mockResolvedValue({ ok: true, accessToken: 'synthetic-company-token' }) })
afterEach(() => vi.unstubAllGlobals())

it('requires company authorization before contacting the API', async () => {
  auth.mockResolvedValue({ ok: false, response: Response.json({}, { status: 403 }) as never })
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
  expect((await POST(request({ ciclo: 1 }), context)).status).toBe(403)
  expect(fetchMock).not.toHaveBeenCalled()
})

it.each([null, {}, { ciclo: 0 }, { ciclo: '1' }, { ciclo: 1.1 }])('rejects invalid input %j', async body => {
  const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
  expect((await POST(request(body), context)).status).toBe(400)
  expect(fetchMock).not.toHaveBeenCalled()
})

it('forwards only the cycle with the verified identity and disables caching', async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { status: 'Aberto', ciclo_atual: 2 } }))
  vi.stubGlobal('fetch', fetchMock)
  const result = await POST(request({ ciclo: 1, owner_sub: 'forged' }), context)
  expect(result.status).toBe(200)
  expect(result.headers.get('Cache-Control')).toContain('no-store')
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toContain('/job%20one/reopen')
  expect(init.headers.Authorization).toBe('Bearer synthetic-company-token')
  expect(JSON.parse(init.body)).toEqual({ ciclo: 1 })
})

it('preserves conflicts and handles transport failures', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({}, { status: 409 })).mockRejectedValueOnce(new Error('network'))
  vi.stubGlobal('fetch', fetchMock)
  expect((await POST(request({ ciclo: 1 }), context)).status).toBe(409)
  expect((await POST(request({ ciclo: 1 }), context)).status).toBe(502)
})
