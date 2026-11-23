import { afterEach, describe, expect, it, vi } from 'vitest'
import { getNotificationRecipients, sendCandidateNotification } from '@/services/candidate-notification-service'

afterEach(() => vi.unstubAllGlobals())
describe('candidate notification client', () => {
  it('loads recipients and propagates access denial', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ data: [] })).mockResolvedValueOnce(Response.json({ message: 'Acesso negado' }, { status: 403 })))
    await expect(getNotificationRecipients('job')).resolves.toEqual([])
    await expect(getNotificationRecipients('job')).rejects.toThrow('Acesso negado')
  })
  it('rejects a malformed recipient list', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: {} })))
    await expect(getNotificationRecipients('job')).rejects.toThrow('Lista de destinatários inválida')
  })
  it('returns the accepted result', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ data: { status: 'accepted', message: 'Aceito' } })))
    expect((await sendCandidateNotification('job', 'candidate', 'Assunto', 'Texto')).status).toBe('accepted')
  })
  it.each([504, 502])('does not retry an uncertain HTTP %s', async status => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status })); vi.stubGlobal('fetch', fetchMock)
    expect((await sendCandidateNotification('job', 'candidate', 'Assunto', 'Texto')).status).toBe('unknown')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('reports missing configuration without claiming success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ message: 'Não configurado' }, { status: 503 })))
    expect(await sendCandidateNotification('job', 'candidate', 'Assunto', 'Texto')).toEqual({ status: 'failed', message: 'Não configurado' })
  })
  it('does not retry a lost response', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network')); vi.stubGlobal('fetch', fetchMock)
    expect((await sendCandidateNotification('job', 'candidate', 'Assunto', 'Texto')).status).toBe('unknown')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
