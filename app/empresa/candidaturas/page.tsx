import { CompanyApplicationsPage } from "@/components/company-applications-page"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CompanyApplicationsRoute() {
  await requireAccountType('COMPANY')
  return <CompanyApplicationsPage />
}
