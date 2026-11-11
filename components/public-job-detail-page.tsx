'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { JobBoardJob } from '@/lib/job-board'
import { fetchPublicJobDetail } from '@/services/public-job-detail-service'

export function PublicJobDetailPage({ guid }: { guid: string }) {
  const [job, setJob] = useState<JobBoardJob | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetchPublicJobDetail(guid, controller.signal)
      .then(setJob)
      .catch(() => { if (!controller.signal.aborted) setError(true) })
    return () => controller.abort()
  }, [guid])

  if (error) return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">Vaga não encontrada</h1><Link className="mt-4 inline-block text-orange-700" href="/jobs/list">Voltar às vagas</Link></main>
  if (!job) return <main className="mx-auto max-w-3xl p-8" role="status">Carregando vaga...</main>
  return <main className="mx-auto my-10 max-w-4xl rounded-3xl border bg-white p-8 shadow-sm">
    <Link href="/jobs/list" className="text-sm font-semibold text-orange-700">← Todas as vagas</Link>
    <p className="mt-8 font-semibold text-orange-700">{job.company}</p><h1 className="mt-2 text-3xl font-bold">{job.title}</h1>
    <p className="mt-3 text-slate-600">{job.location} · {job.workType} · {job.contractType}</p>
    <p className="mt-8 whitespace-pre-line leading-7 text-slate-700">{job.description}</p>
    {job.responsibilities.length ? <section className="mt-8"><h2 className="text-xl font-semibold">Responsabilidades</h2><ul className="mt-3 list-disc pl-6">{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
    {job.requirements.length ? <section className="mt-8"><h2 className="text-xl font-semibold">Requisitos</h2><ul className="mt-3 list-disc pl-6">{job.requirements.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
    {job.benefits.length ? <section className="mt-8"><h2 className="text-xl font-semibold">Benefícios</h2><ul className="mt-3 list-disc pl-6">{job.benefits.map((item) => <li key={item}>{item}</li>)}</ul></section> : null}
    <Link href={job.applyHref} className="mt-8 inline-flex rounded-full bg-orange-600 px-6 py-3 font-semibold text-white">Candidatar-se</Link>
  </main>
}
