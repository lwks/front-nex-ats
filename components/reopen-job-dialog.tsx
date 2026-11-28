'use client'

import { useEffect, useId, useRef, useState } from 'react'

export function ReopenJobDialog({ title, onConfirm, onClose }: {
  title: string; onConfirm: () => Promise<void>; onClose: () => void
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => previous?.focus()
  }, [])
  const confirm = async () => {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try { await onConfirm(); onClose() }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Não foi possível reabrir a vaga.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.stopPropagation(); if (!busy) onClose() }
        if (event.key === 'Tab') {
          const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ?? [])
          const first = elements[0], last = elements[elements.length - 1]
          if (!first) { event.preventDefault(); return }
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
          else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus() }
        }
      }} className="w-full max-w-lg rounded-2xl border-t-4 border-orange-500 bg-white p-6 shadow-xl">
      <h2 id={titleId} className="text-xl font-semibold">Reabrir vaga</h2>
      <p className="mt-4 text-sm leading-relaxed">A vaga <strong>{title}</strong> voltará a receber candidaturas em um novo ciclo.</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">Os candidatos pendentes do ciclo encerrado continuam no histórico. Contratados e rejeitados permanecem nas colunas finais, somente para consulta. Participantes anteriores poderão se candidatar novamente.</p>
      {error ? <p role="alert" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-3">
        <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2 disabled:opacity-50">Cancelar</button>
        <button type="button" disabled={busy} onClick={() => void confirm()} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Reabrindo...' : 'Confirmar reabertura'}</button>
      </div>
    </section>
  </div>
}
