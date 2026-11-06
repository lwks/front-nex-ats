import { requireAccountType } from '@/lib/auth/supabase-server'
import { CandidateProfileEditor } from '@/components/candidate-profile-editor'

export default async function MyProfilePage() {
  await requireAccountType('CANDIDATE')
  return <CandidateProfileEditor />
}
