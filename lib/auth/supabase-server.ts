import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { accountTypeFromClaims, authPagePath, supabaseConfig, type AccountType } from './supabase'

export async function createSupabaseServerClient() {
  const config = supabaseConfig()
  if (!config) return null
  const cookieStore = await cookies()
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Server Components cannot write cookies. The proxy refreshes them.
        }
      },
    },
  })
}

export async function getVerifiedClaims() {
  const client = await createSupabaseServerClient()
  if (!client) return null
  const { data, error } = await client.auth.getClaims()
  return error ? null : data?.claims ?? null
}

export async function requireAccountType(type: AccountType, requestedPath?: string) {
  const claims = await getVerifiedClaims()
  if (!claims) redirect(requestedPath ? authPagePath('login', requestedPath) : '/')
  const actual = accountTypeFromClaims(claims)
  if (!actual) redirect(authPagePath('complete', requestedPath))
  if (actual !== type) redirect(actual === 'COMPANY' ? '/empresa/candidaturas' : '/jobs/list')
  return claims
}
