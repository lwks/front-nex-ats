import { UserRegistrationPage } from "@/components/user-registration-page"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CreateUserPage() {
  await requireAccountType('CANDIDATE')
  return <UserRegistrationPage />
}
