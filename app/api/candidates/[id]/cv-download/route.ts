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
    if (new URL(_request.url).searchParams.get('view') === 'inline' && response.ok) {
      const payload = await response.json()
      const { downloadUrl, filename } = payload.data ?? {}
      if (typeof filename !== 'string' || !filename.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json({ message: 'A visualização está disponível apenas para PDF. Use Baixar CV para arquivos Word.' }, { status: 415 })
      }
      const signedUrl = new URL(downloadUrl)
      if (signedUrl.protocol !== 'https:') throw new Error('Invalid CV URL')
      const file = await fetch(signedUrl, { cache: 'no-store', redirect: 'error' })
      if (!file.ok) return NextResponse.json({ message: 'Não foi possível abrir o currículo. Tente novamente.' }, { status: 502 })
      if (file.headers.get('content-type')?.split(';')[0].trim() !== 'application/pdf') {
        return NextResponse.json({ message: 'O arquivo não está em formato PDF.' }, { status: 415 })
      }
      return new NextResponse(file.body, { headers: {
        'Content-Type': 'application/pdf', 'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      } })
    }
    return new NextResponse(await response.text(), { status: response.status, headers: { 'Content-Type': response.headers.get('Content-Type') ?? 'application/json' } })
  } catch {
    return NextResponse.json({ message: 'Não foi possível preparar o download do CV.' }, { status: 500 })
  }
}
