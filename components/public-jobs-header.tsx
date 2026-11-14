import Link from 'next/link'
import { Briefcase, LogIn, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PublicJobsHeader({ authenticatedUser = null, isCandidate = false, detail = false }: {
  authenticatedUser?: string | null
  isCandidate?: boolean
  detail?: boolean
}) {
  const boardHref = detail ? '/jobs/list' : '#vagas'
  return <header className="border-b border-black/5 bg-white/90 backdrop-blur">
    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4">
      <Link href="/jobs/list" className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-[#FF6B00] text-white shadow-[0_12px_30px_rgba(255,107,0,0.28)]"><Briefcase className="size-5" /></div>
        <div><p className="text-lg font-semibold tracking-tight">ClusterHR</p><p className="text-sm text-slate-500">Job Board</p></div>
      </Link>
      {authenticatedUser && isCandidate ? <Link href="/meu-perfil" className="text-sm font-semibold text-[#C44E00] md:hidden">Meu perfil</Link> : null}
      <div className="hidden items-center gap-6 md:flex">
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href={boardHref} className="transition hover:text-[#FF6B00]">Vagas</Link>
          <Link href={detail ? '/jobs/list#como-funciona' : '#como-funciona'} className="transition hover:text-[#FF6B00]">Como funciona</Link>
          <Link href={detail ? '/jobs/list#contato' : '#contato'} className="transition hover:text-[#FF6B00]">Contato</Link>
        </nav>
        <div className="flex items-center gap-3">
          {authenticatedUser ? <>
            {isCandidate ? <Link href="/meu-perfil" className="text-sm font-semibold text-[#C44E00] hover:underline">Meu perfil</Link> : null}
            <span className="max-w-48 truncate text-sm font-semibold text-slate-700" aria-label="Usuário conectado">{authenticatedUser}</span>
            <a href="/api/auth/logout" className="text-sm text-slate-500 hover:text-slate-900">Sair</a>
          </> : <>
            <Button asChild variant="outline" className="rounded-full border-[#FF6B00]/25 px-5 text-[#C44E00] hover:bg-[#FFF1E8] hover:text-[#C44E00]"><Link href="/?mode=register"><UserPlus className="size-4" />Criar conta</Link></Button>
            <Button asChild className="rounded-full bg-[#FF6B00] px-5 text-white hover:bg-[#E55F00]"><Link href="/?mode=login"><LogIn className="size-4" />Entrar no ATS</Link></Button>
          </>}
        </div>
      </div>
    </div>
  </header>
}
