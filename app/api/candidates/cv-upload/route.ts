import { NextResponse } from 'next/server'
import { CANDIDATES_API_CREATE_URL } from '@/config'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authorization = await authorizeApiAccountType('CANDIDATE')
  if (!authorization.ok) return authorization.response
  try {
    const response = await fetch(`${CANDIDATES_API_CREATE_URL}/cv-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorization.accessToken}` },
      body: JSON.stringify(await request.json()),
      cache: 'no-store',
    })
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' } })
  } catch {
    return NextResponse.json({ message: 'Não foi possível preparar o upload do CV.' }, { status: 500 })
  }
}
