import type { ReactNode } from 'react'
import { requireAccountType } from '@/lib/auth/supabase-server'
import { CompanyPageShell } from '@/components/company-page-shell'

export default async function CreateJobLayout({ children }: { children: ReactNode }) {
  const claims = await requireAccountType('COMPANY')
  return <CompanyPageShell title="Nova vaga" description="Cadastre uma oportunidade para iniciar um novo processo seletivo." accountLabel={claims.email || 'Conta da empresa'}>{children}</CompanyPageShell>
}
