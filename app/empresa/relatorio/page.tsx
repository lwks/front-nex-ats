import { CompanyReportPage } from "@/components/company-report-page"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CompanyReportRoute() {
  const claims = await requireAccountType('COMPANY')
  return <CompanyReportPage accountLabel={claims.email || 'Conta da empresa'} />
}
