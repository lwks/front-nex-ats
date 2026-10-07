import { CompanyReportPage } from "@/components/company-report-page"
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CompanyReportRoute() {
  await requireAccountType('COMPANY')
  return <CompanyReportPage />
}
