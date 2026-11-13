import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  accountTypeFromClaims,
  destinationForAccountType,
  supabaseConfig,
} from '@/lib/auth/supabase'
import { getVerifiedClaims } from '@/lib/auth/supabase-server'

export async function POST(_request: Request) {
  const claims = await getVerifiedClaims()
  if (!claims?.sub) return NextResponse.json({ message: 'Autenticação necessária.' }, { status: 401 })

  const current = accountTypeFromClaims(claims)
  if (current) return NextResponse.json({ accountType: current, destination: destinationForAccountType(current) })

  const config = supabaseConfig()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!config || !serviceKey) {
    return NextResponse.json({ message: 'Configuração de conta indisponível.' }, { status: 503 })
  }

  try {
    const admin = createClient(config.url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data: existing, error: lookupError } = await admin.auth.admin.getUserById(claims.sub)
    if (lookupError || !existing.user) {
      return NextResponse.json({ message: 'Não foi possível consultar a conta.' }, { status: 502 })
    }
    const existingType = existing.user.app_metadata?.account_type
    if (existingType === 'CANDIDATE' || existingType === 'COMPANY') {
      return NextResponse.json({ accountType: existingType, destination: destinationForAccountType(existingType) })
    }

    const { error } = await admin.auth.admin.updateUserById(claims.sub, {
      app_metadata: { ...existing.user.app_metadata, account_type: 'CANDIDATE' },
    })
    if (error) return NextResponse.json({ message: 'Não foi possível salvar o tipo da conta.' }, { status: 502 })
    return NextResponse.json({ accountType: 'CANDIDATE', destination: destinationForAccountType('CANDIDATE') })
  } catch {
    return NextResponse.json({ message: 'Não foi possível concluir o cadastro.' }, { status: 502 })
  }
}
