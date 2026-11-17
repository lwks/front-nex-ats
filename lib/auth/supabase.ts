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

export function candidateApplicationPath(value: string | null | undefined): string | null {
  if (!value?.startsWith('/candidaturas?')) return null

  try {
    const url = new URL(value, 'https://clusterjobs.invalid')
    if (url.origin !== 'https://clusterjobs.invalid' || url.pathname !== '/candidaturas') return null

    for (const key of ['vagaGuid', 'vaga'] as const) {
      const jobId = url.searchParams.get(key)?.trim()
      if (jobId && jobId.length <= 256) return `/candidaturas?${key}=${encodeURIComponent(jobId)}`
    }
  } catch {
    return null
  }

  return null
}

export function destinationAfterSignIn(type: AccountType, requestedPath: string | null | undefined): string {
  return type === 'CANDIDATE'
    ? candidateApplicationPath(requestedPath) ?? destinationForAccountType(type)
    : destinationForAccountType(type)
}

export function authPagePath(mode: 'login' | 'complete', requestedPath: string | null | undefined): string {
  const path = candidateApplicationPath(requestedPath)
  return `/?mode=${mode}${path ? `&next=${encodeURIComponent(path)}` : ''}`
}
