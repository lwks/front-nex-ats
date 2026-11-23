import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/candidates/[id]/cv-download/route'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'
vi.mock('@/lib/auth/require-api-account-type', () => ({ authorizeApiAccountType: vi.fn() }))
const auth = vi.mocked(authorizeApiAccountType)
const context = { params: Promise.resolve({ id: 'synthetic-candidate' }) }
const request = () => new Request('http://localhost/api/candidates/synthetic-candidate/cv-download?view=inline')
const signing = (filename = 'cv.pdf') => Response.json({ data: { filename, downloadUrl: 'https://example.s3.amazonaws.com/cv' } })
describe('CV PDF preview', () => {
  beforeEach(() => auth.mockResolvedValue({ ok: true, accessToken: 'synthetic-token' }))
  afterEach(() => vi.unstubAllGlobals())
  it('streams PDF inline without caching or exposing the signed URL', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(signing()).mockResolvedValueOnce(new Response('%PDF-synthetic', { headers: { 'Content-Type': 'application/pdf' } }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await GET(request(), context)
    expect(result.status).toBe(200)
    expect(result.headers.get('Content-Disposition')).toBe('inline')
    expect(result.headers.get('Cache-Control')).toContain('no-store')
    expect(await result.text()).toBe('%PDF-synthetic')
    expect(fetchMock.mock.calls[1][1]).not.toHaveProperty('headers')
  })
  it('rejects Word without fetching the file', async () => {
    const fetchMock = vi.fn().mockResolvedValue(signing('cv.docx'))
    vi.stubGlobal('fetch', fetchMock)
    expect((await GET(request(), context)).status).toBe(415)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('preserves ownership denial from production API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Forbidden' }, { status: 403 })))
    expect((await GET(request(), context)).status).toBe(403)
  })
  it('does not fetch without company authorization', async () => {
    auth.mockResolvedValue({ ok: false, response: Response.json({}, { status: 401 }) as never })
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    expect((await GET(request(), context)).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('reports expired or unavailable file links', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signing()).mockResolvedValueOnce(new Response('', { status: 403 })))
    expect((await GET(request(), context)).status).toBe(502)
  })
  it('rejects non PDF content despite a PDF filename', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(signing()).mockResolvedValueOnce(new Response('Word', { headers: { 'Content-Type': 'application/msword' } })))
    expect((await GET(request(), context)).status).toBe(415)
  })
  it('reports a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    expect((await GET(request(), context)).status).toBe(500)
  })
})
