import { NextResponse } from 'next/server'
import { CANDIDATES_API_URL } from '@/config'
import { authorizeApiAccountType } from '@/lib/auth/require-api-account-type'

export async function candidateProxy(request: Request, path: string, method: 'GET' | 'PUT' | 'POST') {
  const authorization = await authorizeApiAccountType('CANDIDATE')
  if (!authorization.ok) return authorization.response
  try {
    const query = method === 'GET' ? new URL(request.url).search : ''
    const response = await fetch(`${CANDIDATES_API_URL}${path}${query}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorization.accessToken}` },
      ...(method === 'GET' ? {} : { body: JSON.stringify(await request.json()) }),
      cache: 'no-store',
    })
    return new NextResponse(await response.text(), { status: response.status,
      headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' } })
  } catch {
    return NextResponse.json({ message: 'Serviço de candidaturas indisponível. Tente novamente.' }, { status: 503 })
  }
}
