import type { JwtPayload } from '@supabase/supabase-js'

export type AccountType = 'CANDIDATE' | 'COMPANY'

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  return url && publishableKey ? { url, publishableKey } : null
}

export function accountTypeFromClaims(claims: JwtPayload | null | undefined): AccountType | null {
  const value = (claims?.app_metadata as Record<string, unknown> | undefined)?.account_type
  return value === 'CANDIDATE' || value === 'COMPANY' ? value : null
}

export function pendingAccountTypeFromClaims(claims: JwtPayload | null | undefined): AccountType | null {
  const value = (claims?.user_metadata as Record<string, unknown> | undefined)?.account_type
  return value === 'CANDIDATE' || value === 'COMPANY' ? value : null
}

export function destinationForAccountType(type: AccountType): string {
  return type === 'COMPANY' ? '/empresa/candidaturas' : '/jobs/list'
}
