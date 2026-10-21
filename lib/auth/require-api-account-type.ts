import { NextResponse } from 'next/server'
import { accountTypeFromClaims, supabaseConfig, type AccountType } from './supabase'
import { createSupabaseServerClient } from './supabase-server'

export type ApiAccountAuthorization =
  | { ok: true; accessToken: string }
  | { ok: false; response: NextResponse }

export async function authorizeApiAccountType(type: AccountType): Promise<ApiAccountAuthorization> {
  if (!supabaseConfig()) {
    return { ok: false, response: NextResponse.json({ message: 'Supabase não configurado.' }, { status: 503 }) }
  }

  const client = await createSupabaseServerClient()
  if (!client) {
    return { ok: false, response: NextResponse.json({ message: 'Supabase não configurado.' }, { status: 503 }) }
  }

  const { data: { session }, error: sessionError } = await client.auth.getSession()
  if (sessionError || !session?.access_token) {
    return { ok: false, response: NextResponse.json({ message: 'Autenticação necessária.' }, { status: 401 }) }
  }

  // Validate the exact access token that will be forwarded to the API.
  const { data, error: claimsError } = await client.auth.getClaims(session.access_token)
  const claims = data?.claims
  if (claimsError || !claims) {
    return { ok: false, response: NextResponse.json({ message: 'Autenticação necessária.' }, { status: 401 }) }
  }

  if (accountTypeFromClaims(claims) !== type) {
    return { ok: false, response: NextResponse.json({ message: 'Acesso não permitido para este tipo de conta.' }, { status: 403 }) }
  }

  return { ok: true, accessToken: session.access_token }
}
