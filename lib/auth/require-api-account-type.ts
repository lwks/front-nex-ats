import { NextResponse } from 'next/server'
import { accountTypeFromClaims, supabaseConfig, type AccountType } from './supabase'
import { getVerifiedClaims } from './supabase-server'

export async function accountTypeError(type: AccountType): Promise<NextResponse | null> {
  if (!supabaseConfig()) return NextResponse.json({ message: 'Supabase não configurado.' }, { status: 503 })
  const claims = await getVerifiedClaims()
  if (!claims) return NextResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })
  if (accountTypeFromClaims(claims) !== type) {
    return NextResponse.json({ message: 'Acesso não permitido para este tipo de conta.' }, { status: 403 })
  }
  return null
}
