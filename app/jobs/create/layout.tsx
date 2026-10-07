import type { ReactNode } from 'react'
import { requireAccountType } from '@/lib/auth/supabase-server'

export default async function CreateJobLayout({ children }: { children: ReactNode }) {
  await requireAccountType('COMPANY')
  return children
}
