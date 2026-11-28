import { afterEach, describe, expect, it, vi } from 'vitest'
import { closeCompanyJob, reopenCompanyJob } from '@/services/company-jobs-service'
import { assertVacancyOpen, sendApplication } from '@/services/candidate-application-service'
import { fetchCandidatesByJobGuid } from '@/services/candidates-by-job-guids-service'

afterEach(() => vi.unstubAllGlobals())

describe('job lifecycle contracts', () => {
  it('sends the selected cycle and optional reason when closing', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { status: 'Encerrada', ciclo_atual: 2 } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(closeCompanyJob('job one', ' Motivo ', 2)).resolves.toMatchObject({ status: 'Encerrada' })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/jobs/job%20one/close')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ciclo: 2, motivo_encerramento: 'Motivo' })
  })

  it.each([{}, { status: 'Aberto', ciclo_atual: 2 }, { status: 'Encerrada', ciclo_atual: 1 }])('does not report closure for an invalid success body %j', async data => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data })))
    await expect(closeCompanyJob('job', '', 2)).rejects.toThrow('confirmar o encerramento')
  })

  it('confirms the next cycle on reopening without restoring previous applications', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { status: 'Aberto', ciclo_atual: 3 } }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(reopenCompanyJob('job', 2)).resolves.toEqual({ status: 'Aberto', ciclo_atual: 3 })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ciclo: 2 })
  })

  it.each([{}, { status: 'Encerrada', ciclo_atual: 3 }, { status: 'Aberto', ciclo_atual: 2 }])('fails closed on an invalid reopen result %j', async data => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data })))
    await expect(reopenCompanyJob('job', 2)).rejects.toThrow('confirmar a reabertura')
  })

  it.each([closeCompanyJob, reopenCompanyJob])('does not disclose upstream details on a conflict or service failure', async action => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ message: 'internal token' }, { status: 409 }))
      .mockResolvedValueOnce(Response.json({ message: 'private stack' }, { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)
    const call = () => action === closeCompanyJob ? closeCompanyJob('job', '', 1) : reopenCompanyJob('job', 1)
    await expect(call()).rejects.toThrow('Recarregue')
    await expect(call()).rejects.toThrow('Tente novamente')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('blocks a form opened in a previous cycle', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ data: { status: 'Aberto', ciclo_atual: 2 } })))
    await expect(assertVacancyOpen('job', 1)).rejects.toThrow('novo ciclo')
    await expect(assertVacancyOpen('job', 2)).resolves.toBe(2)
  })

  it.each([0, -1, 1.5, '2', null])('rejects malformed cycle metadata %j', async ciclo_atual => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: { status: 'Aberto', ciclo_atual } })))
    await expect(assertVacancyOpen('job')).rejects.toThrow('ciclo')
  })

  it('queries company history separately and includes the cycle in a new application', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => Response.json({ data: { items: [] } }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchCandidatesByJobGuid('job one', 'history')
    expect(fetchMock.mock.calls[0][0]).toBe('/api/candidates/by-job-guids?guid_vaga=job+one&scope=history')
    await sendApplication({ guid_vaga: 'job one', ciclo: 2, mode: 'USE_SAVED_PROFILE', profileVersion: 1,
      application: { pretensaoSalarial: '10000', mensagemEmpresa: '', compartilhamentoAccepted: true, cvAction: 'KEEP' } })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).ciclo).toBe(2)
  })
})
