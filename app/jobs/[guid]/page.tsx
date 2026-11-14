import { notFound } from 'next/navigation'
import { PublicJobDetailPage } from '@/components/public-job-detail-page'
import { guidFromSharedJobCode } from '@/lib/job-share'
import { getVerifiedClaims } from '@/lib/auth/supabase-server'
import { accountTypeFromClaims } from '@/lib/auth/supabase'

export default async function SharedJobPage({ params }: { params: Promise<{ guid: string }> }) {
  const { guid: code } = await params
  const guid = guidFromSharedJobCode(code)
  if (!guid) notFound()
  const claims = await getVerifiedClaims()
  const userMetadata = claims?.user_metadata as Record<string, unknown> | undefined
  const displayName = typeof userMetadata?.full_name === 'string' && userMetadata.full_name.trim()
    ? userMetadata.full_name.trim()
    : typeof claims?.email === 'string' ? claims.email : null
  return <PublicJobDetailPage guid={guid} authenticatedUser={displayName} isCandidate={claims ? accountTypeFromClaims(claims) === 'CANDIDATE' : false} />
}
