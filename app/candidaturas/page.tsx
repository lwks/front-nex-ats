import { redirect } from "next/navigation"

import { CandidateOnboarding } from "@/components/candidate-onboarding"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CandidateApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ vagaGuid?: string; vaga?: string }>
}) {
  const params = await searchParams
  const jobGuid = params.vagaGuid?.trim() || params.vaga?.trim()
  if (!jobGuid) redirect('/jobs/list?notice=select-job')

  const key = params.vagaGuid?.trim() ? 'vagaGuid' : 'vaga'
  await requireAccountType('CANDIDATE', `/candidaturas?${key}=${encodeURIComponent(jobGuid)}`)

  return <CandidateOnboarding jobGuid={jobGuid} />
}
