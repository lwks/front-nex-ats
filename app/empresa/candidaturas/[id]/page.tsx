import { requireAccountType } from '@/lib/auth/supabase-server'
import { CompanyApplicationDetails } from '@/components/company-application-details'

export default async function ApplicationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const claims = await requireAccountType('COMPANY')
  const { id } = await params
  return <CompanyApplicationDetails id={id} accountLabel={claims.email || 'Conta da empresa'} />
}
