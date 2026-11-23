import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/jobs/[id]/notifications/route'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'

vi.mock('@/lib/auth/require-api-account-type', () => ({ authorizeApiAccountType: vi.fn() }))
const auth = vi.mocked(authorizeApiAccountType)
const context = { params: Promise.resolve({ id: 'job-test' }) }
const body = { candidateId: 'candidate-test', subject: 'Atualização da vaga', text: 'Mensagem de teste' }
const request = (input: unknown = body) => new Request('http://localhost/api/jobs/job-test/notifications', { method: 'POST', body: JSON.stringify(input) })
const candidate = (overrides = {}) => Response.json({ data: { id: 'candidate-test', guid_vaga: 'job-test', contato: 'synthetic@example.com', ...overrides } })

describe('candidate notification BFF', () => {
  beforeEach(() => {
    auth.mockResolvedValue({ ok: true, accessToken: 'synthetic-company-token' })
    vi.stubEnv('EMAIL_SERVICE_TOKEN', 'synthetic-service-token')
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

  it('lists owned recipients without exposing their emails or service token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: { items: [
      { id: 'c1', nome: 'Pessoa Teste', contato: 'synthetic@example.com' }, { id: 'c2', fullName: 'Sem email' },
    ] } })))
    const response = await GET(new Request('http://localhost'), context)
    expect(await response.json()).toEqual({ data: [{ id: 'c1', name: 'Pessoa Teste', hasEmail: true }, { id: 'c2', name: 'Sem email', hasEmail: false }] })
    expect(response.headers.get('Cache-Control')).toContain('no-store')
  })
  it('fails on invalid candidate list rather than assuming no candidates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: {} })))
    expect((await GET(new Request('http://localhost'), context)).status).toBe(502)
  })
  it('requires company authorization for both actions', async () => {
    auth.mockResolvedValue({ ok: false, response: Response.json({}, { status: 403 }) as never })
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    expect((await GET(new Request('http://localhost'), context)).status).toBe(403)
    expect((await POST(request(), context)).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('preserves ownership denial while loading recipients', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })))
    expect((await GET(new Request('http://localhost'), context)).status).toBe(403)
  })
  it('resolves the destination from the API and sends only with the server credential', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(Response.json({ data: { status: 'accepted', messageId: 'synthetic-id' } }, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const response = await POST(request(), context)
    expect((await response.json()).data.status).toBe('accepted')
    const send = fetchMock.mock.calls[1][1]
    expect(send.headers.Authorization).toBe('Bearer synthetic-service-token')
    expect(JSON.parse(send.body)).toEqual({ to: 'synthetic@example.com', subject: body.subject, text: body.text })
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer synthetic-company-token')
  })
  it.each([
    { ...body, to: 'injected@example.com' }, { ...body, subject: 'Assunto\ncom quebra' },
    { ...body, text: 'á'.repeat(26000) }, { ...body, text: '' }, { ...body, candidateId: null },
  ])('rejects invalid or arbitrary destination payloads', async input => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    expect((await POST(request(input), context)).status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('explains missing configuration before attempting an email', async () => {
    vi.stubEnv('EMAIL_SERVICE_TOKEN', '')
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    expect((await POST(request(), context)).status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('blocks a candidate from a different vacancy', async () => {
    const fetchMock = vi.fn().mockResolvedValue(candidate({ guid_vaga: 'other-job' })); vi.stubGlobal('fetch', fetchMock)
    expect((await POST(request(), context)).status).toBe(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('does not send after a candidate authorization denial', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 403 })); vi.stubGlobal('fetch', fetchMock)
    expect((await POST(request(), context)).status).toBe(403)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('skips candidates without email', async () => {
    const fetchMock = vi.fn().mockResolvedValue(candidate({ contato: undefined })); vi.stubGlobal('fetch', fetchMock)
    expect((await (await POST(request(), context)).json()).data.status).toBe('skipped')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it.each([502, 504])('marks HTTP %s as uncertain and never retries', async status => {
    const fetchMock = vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(new Response('', { status }))
    vi.stubGlobal('fetch', fetchMock)
    expect((await (await POST(request(), context)).json()).data.status).toBe('unknown')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('does not expose SMTP errors or secrets', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(Response.json({ message: 'secret smtp internal detail' }, { status: 503 })))
    const response = await POST(request(), context)
    const result = await response.json()
    expect(result.data.status).toBe('failed')
    expect(JSON.stringify(result)).not.toContain('secret')
  })
  it('marks lost transport response as uncertain', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(candidate()).mockRejectedValueOnce(new Error('timeout'))
    vi.stubGlobal('fetch', fetchMock)
    expect((await (await POST(request(), context)).json()).data.status).toBe('unknown')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it('does not label an unexpected SMTP success response as a safe failure to retry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(candidate()).mockResolvedValueOnce(Response.json({}, { status: 202 })))
    expect((await (await POST(request(), context)).json()).data.status).toBe('unknown')
  })
})
