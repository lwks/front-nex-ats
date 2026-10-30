import { CompanyApplicationsPage } from "@/components/company-applications-page"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CompanyApplicationsRoute() {
  const claims = await requireAccountType('COMPANY')
  return <CompanyApplicationsPage companyUserId={claims.sub} />
}
