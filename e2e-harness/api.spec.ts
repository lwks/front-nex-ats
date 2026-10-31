import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'

test('real local services: sessions, pages, CRUD, CV, role checks and doctor', async ({ request }) => {
  test.setTimeout(120_000)
  const base = 'http://localhost:3100'
  const origin = { origin: base }
  expect((await request.get('/api/local/health')).status()).toBe(200)
  expect((await request.post('/api/jobs', { data: { guid_id: randomUUID() } })).status()).toBe(401)
  expect((await request.post('/api/local/profile', { headers: origin, form: { profile: 'ADMIN' } })).status()).toBe(400)
  expect((await request.post('/api/local/profile', { headers: { origin: 'https://example.com' }, form: { profile: 'COMPANY' } })).status()).toBe(403)
  const signIn = async (profile: string) => {
    const response = await request.post('/api/local/profile', { headers: origin, form: { profile }, maxRedirects: 0 })
    expect(response.status()).toBe(303)
    const session = await (await request.get('/api/auth/session')).json()
    expect(session).toMatchObject({ authenticated: true, accountType: profile })
  }
  await signIn('COMPANY')
  for (const route of ['/empresa/candidaturas', '/empresa/relatorio', '/jobs/create']) {
    const page = await request.get(route)
    expect(page.status()).toBe(200)
    expect(await page.text()).toContain('Entrar como candidato')
  }
  const jobId = randomUUID()
  const job = await request.post('/api/jobs', { data: {
    guid_id: jobId, titulo: 'Vaga HTTP do harness', descricao: 'Vaga fictícia de teste de integração entre front e back.',
    cidade: 'São Paulo', estado: 'SP', status: 'Aberto',
  } })
  expect(job.status()).toBe(201)
  expect((await job.json()).data.owner_sub).toBe('company')

  await signIn('CANDIDATE')
  expect((await request.post('/api/jobs', { data: { guid_id: randomUUID() } })).status()).toBe(403)
  // Streaming Server Components may carry redirects in HTML after status 200.
  const blockedPage = await request.get('/empresa/candidaturas', { maxRedirects: 0 })
  if (blockedPage.status() === 200) expect(await blockedPage.text()).toMatch(/NEXT_REDIRECT;replace;\/jobs\/list|url=\/jobs\/list/)
  else expect(blockedPage.headers().location).toBe('/jobs/list')
  const registration = await request.get(`/candidaturas?vagaGuid=${jobId}`)
  expect(registration.status()).toBe(200)
  const candidateId = randomUUID()
  const bytes = Buffer.from('%PDF-1.4 harness integration fixture')
  const prepare = await request.post('/api/candidates/cv-upload', { data: {
    candidateId, filename: 'curriculo.pdf', contentType: 'application/pdf', size: bytes.length,
  } })
  expect(prepare.status()).toBe(200)
  const upload = (await prepare.json()).data
  expect(new URL(upload.uploadUrl).origin).toBe('http://localhost:3101')
  expect((await request.put(upload.uploadUrl, { headers: { 'content-type': 'application/pdf' }, data: bytes })).status()).toBe(200)
  const candidate = await request.post('/api/candidates', { data: {
    guid_id: candidateId, guid_vaga: jobId, nome: 'Candidata HTTP', contato: 'candidate@example.com',
    cv: { key: upload.key, filename: 'curriculo.pdf', contentType: 'application/pdf', size: bytes.length },
  } })
  expect(candidate.status()).toBe(201)
  expect((await request.get(`/api/candidates/${candidateId}/cv-download`)).status()).toBe(403)

  await signIn('COMPANY')
  expect((await request.put(`/api/candidates/${candidateId}`, { data: { status: 'entrevista-rh', anotacoes: 'Integrado' } })).status()).toBe(200)
  const list = await (await request.get(`/api/candidates/by-job-guids?guid_vaga=${jobId}`)).json()
  expect(list.data.items[0]).toMatchObject({ guid_id: candidateId, anotacoes: 'Integrado', status: 'entrevista-rh' })
  const download = await request.get(`/api/candidates/${candidateId}/cv-download`)
  expect(download.status()).toBe(200)
  const file = await request.get((await download.json()).data.downloadUrl)
  expect(await file.body()).toEqual(bytes)
  expect((await request.get('/api/zips/01001000')).status()).toBe(200)
  expect((await request.get('/api/zips/00000000')).status()).toBe(404)
  const output = execFileSync(process.execPath, ['scripts/local-harness.mjs', 'doctor'], {
    env: { ...process.env, HARNESS_FRONT_PORT: '3100', HARNESS_BACK_PORT: '3101', E2E_SUPABASE_PORT: '54330' }, encoding: 'utf8',
  })
  expect(output).toContain('OK ats-local-api')
  // Authentication simulator must reject a forged bearer before the API accepts it.
  const invalid = await request.get('http://localhost:3101/api/candidates', { headers: { authorization: 'Bearer forged' } })
  expect(invalid.status()).toBe(401)
  await request.get('/api/auth/logout')
  expect(await (await request.get('/api/auth/session')).json()).toMatchObject({ authenticated: false })
})
