import { PublicJobsBoard } from "@/components/public-jobs-board"
import { getVerifiedClaims } from "@/lib/auth/supabase-server"

export default async function JobsListPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>
}) {
  const { notice } = await searchParams
  const claims = await getVerifiedClaims()
  const userMetadata = claims?.user_metadata as Record<string, unknown> | undefined
  const displayName = typeof userMetadata?.full_name === "string" && userMetadata.full_name.trim()
    ? userMetadata.full_name.trim()
    : typeof claims?.email === "string" ? claims.email : null

  return <PublicJobsBoard authenticatedUser={displayName} notice={notice === "select-job" ? "select-job" : null} />
}
