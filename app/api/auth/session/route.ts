import { NextResponse } from 'next/server'
import { accountTypeFromClaims, supabaseConfig } from '@/lib/auth/supabase'
import { getVerifiedClaims } from '@/lib/auth/supabase-server'

export async function GET() {
  const claims = await getVerifiedClaims()
  return NextResponse.json({
    authEnabled: Boolean(supabaseConfig()),
    authenticated: Boolean(claims),
    expiresAt: typeof claims?.exp === 'number' ? new Date(claims.exp * 1000).toISOString() : null,
    accountType: accountTypeFromClaims(claims),
    user: claims ? { sub: claims.sub, email: claims.email ?? undefined } : null,
  })
}
