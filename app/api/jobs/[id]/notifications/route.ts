import { NextResponse } from 'next/server'
import { API_BASE_URL, CANDIDATES_API_URL, CANDIDATES_BY_JOB_GUIDS_API_URL } from '@/config'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }
type RecordData = Record<string, unknown>
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
const value = (...values: unknown[]) => values.find(v => typeof v === 'string' && v.trim()) as string | undefined

export async function GET(_request: Request, context: Context) {
  const auth = await authorizeApiAccountType('COMPANY')
  if (!auth.ok) return auth.response
  try {
    const { id } = await context.params
    // The API checks ownership of this vacancy before returning its candidates.
    const response = await fetch(`${CANDIDATES_BY_JOB_GUIDS_API_URL}?${new URLSearchParams({ guid_vaga: id })}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` }, cache: 'no-store',
    })
    if (!response.ok) return json({ message: 'Não foi possível consultar os destinatários desta vaga.' }, response.status)
    const payload = await response.json()
    const items = payload.data?.items
    if (!Array.isArray(items)) return json({ message: 'A API retornou uma lista de candidatos inválida.' }, 502)
    return json({ data: items.map((item: RecordData) => ({
      id: value(item.id, item.guid_id), name: value(item.nome, item.fullName, item.name) ?? 'Candidato',
      hasEmail: Boolean(value(item.contato, item.email, item.cd_email)),
    })).filter(item => item.id) })
  } catch { return json({ message: 'Não foi possível consultar os destinatários.' }, 502) }
}

export async function POST(request: Request, context: Context) {
  const auth = await authorizeApiAccountType('COMPANY')
  if (!auth.ok) return auth.response
  let body
  try { body = await request.json() } catch { return json({ message: 'Mensagem inválida.' }, 400) }
  if (!body || typeof body.candidateId !== 'string' || !body.candidateId.trim()
    || typeof body.subject !== 'string' || !body.subject.trim() || body.subject.length > 200 || /[\r\n\x00]/.test(body.subject)
    || typeof body.text !== 'string' || !body.text.trim() || Buffer.byteLength(body.text, 'utf8') > 51200
    || Object.keys(body).some(key => !['candidateId', 'subject', 'text'].includes(key))) {
    return json({ message: 'Informe candidato, assunto (até 200 caracteres) e mensagem (até 50 KB).' }, 400)
  }
  const serviceToken = process.env.EMAIL_SERVICE_TOKEN
  if (!serviceToken) return json({ message: 'O serviço de e-mail ainda não está configurado neste servidor.' }, 503)
  try {
    const { id } = await context.params
    // Candidate GET independently verifies the company's ownership. Never accept an email from the browser.
    const candidateResponse = await fetch(`${CANDIDATES_API_URL}/${encodeURIComponent(body.candidateId)}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` }, cache: 'no-store',
    })
    if (!candidateResponse.ok) return json({ message: 'Candidatura indisponível para esta empresa.' }, candidateResponse.status)
    const { data: candidate } = await candidateResponse.json()
    if (!candidate || candidate.guid_vaga !== id) return json({ message: 'O candidato não pertence a esta vaga.' }, 403)
    const to = value(candidate.contato, candidate.email, candidate.cd_email)
    if (!to) return json({ data: { status: 'skipped', message: 'Candidato sem e-mail.' } })
    try {
      const response = await fetch(`${API_BASE_URL}/emails`, {
        method: 'POST', headers: { Authorization: `Bearer ${serviceToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject: body.subject.trim(), text: body.text.trim() }),
        cache: 'no-store', signal: AbortSignal.timeout(25000),
      })
      const payload = await response.json().catch(() => null)
      if (response.status === 202 && payload?.data?.status === 'accepted') return json({ data: { status: 'accepted', message: 'Aceito pelo serviço de e-mail.' } })
      if (response.ok || (response.status >= 500 && response.status !== 503)) return json({ data: { status: 'unknown', message: 'Aceite incerto. Confira os registros da Brevo antes de reenviar.' } })
      return json({ data: { status: 'failed', message: 'O serviço não aceitou o envio. Verifique a configuração ou a mensagem.' } })
    } catch {
      return json({ data: { status: 'unknown', message: 'Aceite incerto. Confira os registros da Brevo antes de reenviar.' } })
    }
  } catch { return json({ message: 'Não foi possível consultar a candidatura. Nenhum envio foi iniciado.' }, 502) }
}
