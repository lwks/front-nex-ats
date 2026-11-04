import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOwnApplication, getSavedProfile, profileFromForm, sendApplication, uploadProfileCv } from '@/services/candidate-application-service'

afterEach(() => vi.unstubAllGlobals())

describe('candidate application service', () => {
  it('loads own profile and existing application through the authenticated proxies', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { nome: 'Ana', version: 2 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: null }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await getSavedProfile()).toMatchObject({ nome: 'Ana', version: 2 })
    expect(await getOwnApplication('job one')).toBeNull()
    expect(fetchMock.mock.calls[1][0]).toBe('/api/candidates/me/applications?guid_vaga=job%20one')
  })

  it('excludes vacancy-specific data and consent from reusable profile data', () => {
    const profile = profileFromForm({ nome: 'Ana', industriaInteresse: ['3'], areaPreferencia: ['4'],
      lgpdAccepted: true, compartilhamentoAccepted: true, pretensaoSalarial: '12000', mensagemEmpresa: 'Olá' })
    expect(profile).toMatchObject({ nome: 'Ana', industriaInteresse: [3], areaPreferencia: [4] })
    expect(profile).not.toHaveProperty('lgpdAccepted')
    expect(profile).not.toHaveProperty('compartilhamentoAccepted')
    expect(profile).not.toHaveProperty('pretensaoSalarial')
    expect(profile).not.toHaveProperty('mensagemEmpresa')
  })

  it('sends application mode and preserves the server conflict as actionable feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'duplicate' }), { status: 409 }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendApplication({ guid_vaga: 'job-1', mode: 'USE_SAVED_PROFILE', profileVersion: 2,
      application: { mensagemEmpresa: '', pretensaoSalarial: '12000', compartilhamentoAccepted: true, cvAction: 'REMOVE' } }))
      .rejects.toThrow('Recarregue')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ mode: 'USE_SAVED_PROFILE', profileVersion: 2,
      application: { cvAction: 'REMOVE' } })
  })

  it('uploads a new CV using the signed URL', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { uploadUrl: 'https://example.test/upload', key: 'cvs/candidate/profile/uuid.pdf' } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['%PDF'], 'cv.pdf', { type: 'application/pdf' })
    expect(await uploadProfileCv(file)).toMatchObject({ filename: 'cv.pdf', key: 'cvs/candidate/profile/uuid.pdf' })
    expect(fetchMock.mock.calls[1][0]).toBe('https://example.test/upload')
    expect(fetchMock.mock.calls[1][1].method).toBe('PUT')
    expect(fetchMock.mock.calls[1][1].headers['If-None-Match']).toBe('*')
  })
})
