import Link from 'next/link'

export function CandidatePageHeader({ area }: { area: 'profile' | 'application' }) {
  if (area === 'profile') {
    return <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
      <Link href="/jobs/list" className="font-medium text-slate-600 hover:text-orange-600">Voltar às vagas</Link>
      <div className="flex items-center gap-4"><span className="font-semibold">Meu perfil</span><a href="/api/auth/logout" className="text-sm text-slate-600">Sair</a></div>
    </div></header>
  }

  return <header className="border-b border-black/5 bg-white/90 backdrop-blur">
    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
      <Link href="/jobs/list" className="text-sm font-medium text-slate-600 transition hover:text-[#FF6B00]">Voltar às vagas</Link>
      <div className="rounded-full border border-[#FF6B00]/15 bg-[#FF6B00]/8 px-4 py-2 text-sm font-medium text-[#C44E00]">Candidatura</div>
    </div>
  </header>
}
