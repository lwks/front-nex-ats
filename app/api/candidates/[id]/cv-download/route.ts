import { NextResponse } from 'next/server'
import { CANDIDATES_API_CREATE_URL } from '@/config'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApiAccountType('COMPANY')
  if (!authorization.ok) return authorization.response
  try {
    const { id } = await params
    const response = await fetch(`${CANDIDATES_API_CREATE_URL}/${encodeURIComponent(id)}/cv-download`, { headers: { Authorization: `Bearer ${authorization.accessToken}` }, cache: 'no-store' })
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' } })
  } catch {
    return NextResponse.json({ message: 'Não foi possível preparar o download do CV.' }, { status: 500 })
  }
}
