import { requireAccountType } from '@/lib/auth/supabase-server'
import { CandidateApplications } from '@/components/candidate-applications'

export default async function MyApplicationsPage() {
  await requireAccountType('CANDIDATE', '/minhas-candidaturas')
  return <CandidateApplications />
}
