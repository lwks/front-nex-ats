import { redirect } from 'next/navigation'
import { LoginPage } from '@/components/login-page'
import { accountTypeFromClaims, authPagePath, destinationAfterSignIn } from '@/lib/auth/supabase'
import { getVerifiedClaims } from '@/lib/auth/supabase-server'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mode?: string; next?: string }> }) {
  const { mode, next } = await searchParams
  if (!mode) redirect('/jobs/list')
  const claims = await getVerifiedClaims()
  const type = accountTypeFromClaims(claims)
  if (type && mode !== 'recover') redirect(destinationAfterSignIn(type, next))
  if (claims && !type && mode !== 'complete' && mode !== 'recover') redirect(authPagePath('complete', next))
  return <LoginPage />
}
