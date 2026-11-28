import { NextResponse } from 'next/server'
import { JOBS_API_URL } from '@/config'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'
import { CORS_HEADERS, corsOptionsResponse } from '../../../cors'

export const dynamic = 'force-dynamic'
export async function OPTIONS() { return corsOptionsResponse() }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApiAccountType('COMPANY')
  if (!authorization.ok) return authorization.response
  let body: { ciclo?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ message: 'Solicitação inválida.' }, { status: 400 }) }
  if (!body || typeof body.ciclo !== 'number' || !Number.isSafeInteger(body.ciclo) || body.ciclo < 1) {
    return NextResponse.json({ message: 'Informe o ciclo da vaga.' }, { status: 400 })
  }
  try {
    const { id } = await context.params
    const response = await fetch(`${JOBS_API_URL}/${encodeURIComponent(id)}/reopen`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorization.accessToken}` },
      body: JSON.stringify({ ciclo: body.ciclo }), cache: 'no-store',
    })
    return new NextResponse(await response.text(), { status: response.status,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } })
  } catch { return NextResponse.json({ message: 'Não foi possível reabrir a vaga.' }, { status: 502, headers: CORS_HEADERS }) }
}
