import { CandidateOnboarding } from "@/components/candidate-onboarding"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CandidateApplicationPage() {
  await requireAccountType('CANDIDATE')
  return <CandidateOnboarding />
}
