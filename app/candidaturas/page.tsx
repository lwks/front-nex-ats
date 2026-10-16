import { redirect } from "next/navigation"

import { CandidateOnboarding } from "@/components/candidate-onboarding"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CandidateApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ vagaGuid?: string; vaga?: string }>
}) {
  await requireAccountType('CANDIDATE')
  const params = await searchParams
  const jobGuid = params.vagaGuid?.trim() || params.vaga?.trim()
  if (!jobGuid) redirect('/jobs/list?notice=select-job')

  return <CandidateOnboarding jobGuid={jobGuid} />
}
