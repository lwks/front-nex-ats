import type { ReactNode } from 'react'
import { AtsSidebar } from '@/components/ats-sidebar'

export function CompanyPageShell({ title, description, accountLabel, children }: {
  title: string
  description: string
  accountLabel: string
  children: ReactNode
}) {
  return <div className="flex min-h-screen bg-gray-50 text-black">
    <AtsSidebar activeItem="ats" />
    <main className="min-w-0 flex-1">
      <header className="border-b border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-[#FF6B00]">ATS</p>
            <h1 className="mt-1 text-2xl font-semibold text-black">{title}</h1>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="max-w-52 truncate font-medium text-slate-700" aria-label="Conta da empresa">{accountLabel}</span>
            <a href="/api/auth/logout" className="text-orange-700 hover:underline">Sair</a>
          </div>
        </div>
      </header>
      {children}
    </main>
  </div>
}
