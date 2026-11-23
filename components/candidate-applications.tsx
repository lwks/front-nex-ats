'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { sharedJobPath } from '@/lib/job-share'
import { getMyApplications, type CandidateApplicationSummary } from '@/services/candidate-application-service'

type Status = 'open' | 'closed' | 'all'

export function CandidateApplications() {
  const [status, setStatus] = useState<Status>('open')
  return <div className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 p-5">
      <Link href="/jobs/list" className="text-orange-700">Voltar às vagas</Link>
      <Link href="/meu-perfil">Meu perfil</Link>
      <a href="/api/auth/logout">Sair</a>
    </nav></header>
    <main className="mx-auto max-w-5xl p-5 sm:p-8">
      <h1 className="text-3xl font-semibold">Minhas candidaturas</h1>
      <p className="mt-3 text-slate-600">Acompanhe suas candidaturas e consulte os processos encerrados.</p>
      <div className="my-6 flex flex-wrap gap-2" role="group" aria-label="Status das vagas das candidaturas">
        {([['open', 'Abertas'], ['closed', 'Encerradas'], ['all', 'Todas']] as const).map(([value, label]) => (
          <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)}
            className={`rounded-full border px-5 py-2 font-semibold ${status === value ? 'border-orange-600 bg-orange-50 text-orange-800' : 'border-slate-300 bg-white'}`}>{label}</button>
        ))}
      </div>
      <CandidateApplicationsResults key={status} status={status} />
    </main>
  </div>
}

function CandidateApplicationsResults({ status }: { status: Status }) {
  const [items, setItems] = useState<CandidateApplicationSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    getMyApplications(status, controller.signal).then(setItems).catch(() => {
      if (!controller.signal.aborted) setError('Não foi possível consultar suas candidaturas. Tente novamente.')
    })
    return () => controller.abort()
  }, [status])
  if (error) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</p>
  if (!items) return <p role="status">Carregando candidaturas...</p>
  return <CandidateApplicationsList items={items} />
}

export function CandidateApplicationsList({ items }: { items: CandidateApplicationSummary[] }) {
  if (!items.length) return <p className="rounded-xl border bg-white p-6">Nenhuma candidatura encontrada neste filtro.</p>
  return <ul className="space-y-4">{items.map(item => <li key={item.id} className="rounded-2xl border bg-white p-6">
    <h2 className="text-xl font-semibold">{item.title}</h2>
    {item.company ? <p className="mt-1 text-slate-600">{item.company}</p> : null}
    <p className="mt-3 text-sm">Status da vaga: <strong>{item.jobStatus || 'Indisponível'}</strong></p>
    <p className="mt-2 text-sm">Etapa da candidatura: {item.status}</p>
    {item.jobStatus === 'Encerrada' ? <p className="mt-3 text-sm text-slate-600">Processo encerrado. Nenhuma nova candidatura é permitida.</p> : null}
    {item.jobStatus ? <Link className="mt-4 inline-block font-semibold text-orange-700" href={sharedJobPath(item.jobGuid, item.title) ?? '/jobs/list'}>Ver detalhes da vaga</Link> : null}
  </li>)}</ul>
}
