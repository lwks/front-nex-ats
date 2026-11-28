'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fetchCandidatesByJobGuid } from '@/services/candidates-by-job-guids-service'
import { extractCandidateItems, normalizeCandidate, type Application } from '@/components/application-board'

export function CompanyJobHistory({ jobGuid }: { jobGuid: string }) {
  const [items, setItems] = useState<Application[] | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    fetchCandidatesByJobGuid(jobGuid, 'history').then(payload => {
      const candidates = extractCandidateItems(payload).map(normalizeCandidate).filter((item): item is Application => item !== null)
      if (active) setItems(candidates)
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [jobGuid])
  return <details className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
    <summary className="cursor-pointer font-semibold">Histórico de candidaturas encerradas{items ? ` (${items.length})` : ''}</summary>
    {error ? <p role="alert" className="mt-3 text-sm text-amber-900">Não foi possível carregar o histórico. Recarregue a página para tentar novamente.</p>
      : !items ? <p role="status" className="mt-3 text-sm">Carregando histórico...</p>
      : !items.length ? <p className="mt-3 text-sm text-slate-600">Nenhuma candidatura encerrada nesta vaga.</p>
      : <ul className="mt-4 space-y-3">{items.map(item => <li key={item.id} className="rounded-lg border bg-white p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.nome}</strong><span className="text-slate-500">Ciclo {item.ciclo ?? 1}</span></div>
        {item.historico?.map(event => <p key={`${event.tipo}-${event.ciclo}`} className="mt-2 leading-relaxed text-slate-700">{event.mensagem}</p>)}
        <Link href={`/empresa/candidaturas/${encodeURIComponent(item.recordId ?? item.id)}`} className="mt-3 inline-block font-semibold text-orange-700">Consultar candidatura</Link>
      </li>)}</ul>}
  </details>
}
