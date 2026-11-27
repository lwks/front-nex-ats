export type NotificationRecipient = { id: string; name: string; hasEmail: boolean }
export type NotificationResult = { status: 'accepted' | 'failed' | 'unknown' | 'skipped'; message: string }
const url = (jobId: string) => `/api/jobs/${encodeURIComponent(jobId)}/notifications`

export async function getNotificationRecipients(jobId: string, cycle = 1): Promise<NotificationRecipient[]> {
  const response = await fetch(`${url(jobId)}?ciclo=${cycle}`, { cache: 'no-store' })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload?.message ?? 'Não foi possível consultar os destinatários.')
  if (!Array.isArray(payload?.data)) throw new Error('Lista de destinatários inválida.')
  return payload.data
}

export async function sendCandidateNotification(jobId: string, candidateId: string, subject: string, text: string, cycle = 1): Promise<NotificationResult> {
  // Never retry a transmission automatically: a lost response may have been accepted by SMTP.
  try {
    const response = await fetch(url(jobId), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId, subject, text, ciclo: cycle }),
    })
    const payload = await response.json()
    if (response.status >= 500 && response.status !== 503) return { status: 'unknown', message: 'Resultado incerto. Confira os registros da Brevo antes de reenviar.' }
    if (!response.ok) return { status: 'failed', message: payload?.message ?? 'Envio não iniciado.' }
    if (!['accepted', 'failed', 'unknown', 'skipped'].includes(payload?.data?.status)) throw new Error('Invalid response')
    return payload.data
  } catch { return { status: 'unknown', message: 'Resultado incerto. Confira os registros da Brevo antes de reenviar.' } }
}
