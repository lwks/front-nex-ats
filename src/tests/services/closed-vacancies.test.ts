import { afterEach, describe, expect, it, vi } from 'vitest'
import { assertVacancyOpen, VacancyClosedError, getMyApplications, sendApplication } from '@/services/candidate-application-service'
import { fetchPublicJobsPage } from '@/services/public-jobs-service'
afterEach(() => vi.unstubAllGlobals())
describe('closed vacancy contracts', () => {
  it('filters defensive responses and sends the selected status with the cursor', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ data: { items: [
      { id: 'open', status: 'Aberto' }, { id: 'closed', status: 'Encerrada' }], lastKey: 'next' } }))
    vi.stubGlobal('fetch', fetchMock)
    expect((await fetchPublicJobsPage()).jobs.map(j => j.id)).toEqual(['open'])
    expect((await fetchPublicJobsPage({ status: 'closed', lastKey: 'cursor' })).jobs.map(j => j.id)).toEqual(['closed'])
    expect(fetchMock.mock.calls[1][0]).toBe('/api/jobs?limit=6&status=closed&lastKey=cursor')
  })
  it('rechecks availability and fails closed on unavailable or malformed responses', async () => {
    const mock = vi.fn().mockResolvedValueOnce(Response.json({ data: { status: 'Encerrada' } }))
      .mockResolvedValueOnce(Response.json({ data: { status: 'Aberto' } }))
      .mockResolvedValueOnce(Response.json({ data: {} }))
      .mockRejectedValueOnce(new Error('offline'))
    vi.stubGlobal('fetch', mock)
    await expect(assertVacancyOpen('job')).rejects.toBeInstanceOf(VacancyClosedError)
    await expect(assertVacancyOpen('job')).resolves.toBeUndefined()
    await expect(assertVacancyOpen('job')).rejects.toThrow('confirmar')
    await expect(assertVacancyOpen('job')).rejects.toThrow('offline')
  })
  it('preserves an explicit closed-vacancy error returned at submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Vacancy is closed' }, { status: 409 })))
    await expect(sendApplication({ guid_vaga: 'job', mode: 'USE_SAVED_PROFILE', application: {
      mensagemEmpresa: '', pretensaoSalarial: '1', compartilhamentoAccepted: true, cvAction: 'KEEP' } }))
      .rejects.toBeInstanceOf(VacancyClosedError)
  })
  it('loads only the selected candidate history filter and handles invalid data and errors', async () => {
    const mock = vi.fn().mockResolvedValueOnce(Response.json({ data: { items: [{ id: 'mine' }] } }))
      .mockResolvedValueOnce(Response.json({ data: {} }))
      .mockResolvedValueOnce(Response.json({}, { status: 403 }))
    vi.stubGlobal('fetch', mock)
    expect(await getMyApplications('closed')).toEqual([{ id: 'mine' }])
    expect(mock.mock.calls[0][0]).toContain('status=closed')
    await expect(getMyApplications('all')).rejects.toThrow('inválida')
    await expect(getMyApplications('open')).rejects.toThrow('candidato')
  })
})
