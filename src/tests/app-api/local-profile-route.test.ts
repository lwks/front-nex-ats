import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mock = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))
vi.mock('@/lib/auth/supabase-server', () => ({ createSupabaseServerClient: async () => ({ auth: mock }) }))
import { POST } from '@/app/api/local/profile/route'

function request(profile = 'COMPANY', origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/local/profile', {
    method: 'POST', headers: { origin }, body: new URLSearchParams({ profile }),
  })
}

describe('local profile selection', () => {
  beforeEach(() => {
    vi.stubEnv('HARNESS_MODE', 'local')
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3001/api')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54329')
    mock.signInWithPassword.mockResolvedValue({ error: null })
  })
  afterEach(() => vi.unstubAllEnvs())
  it('uses the local auth session and redirects each role', async () => {
    expect((await POST(request())).headers.get('location')).toBe('http://localhost:3000/empresa/candidaturas')
    expect((await POST(request('CANDIDATE'))).headers.get('location')).toBe('http://localhost:3000/jobs/list')
    expect(mock.signInWithPassword).toHaveBeenCalledWith({ email: 'candidate@example.com', password: 'correct-password' })
  })
  it('is unavailable in normal mode and rejects unknown profiles and cross-origin forms', async () => {
    expect((await POST(request('ADMIN'))).status).toBe(400)
    expect((await POST(request('COMPANY', 'https://example.com'))).status).toBe(403)
    vi.stubEnv('HARNESS_MODE', '')
    expect((await POST(request())).status).toBe(404)
  })
  it('reports unavailable local auth without accepting a session', async () => {
    mock.signInWithPassword.mockResolvedValue({ error: new Error('offline') })
    expect((await POST(request())).status).toBe(503)
  })
})
