import { redirect } from 'next/navigation'
import { LoginPage } from '@/components/login-page'
import { accountTypeFromClaims, destinationForAccountType } from '@/lib/auth/supabase'
import { getVerifiedClaims } from '@/lib/auth/supabase-server'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  const claims = await getVerifiedClaims()
  const type = accountTypeFromClaims(claims)
  if (type && mode !== 'recover') redirect(destinationForAccountType(type))
  if (claims && !type && mode !== 'complete' && mode !== 'recover') redirect('/?mode=complete')
  return <LoginPage />
}
