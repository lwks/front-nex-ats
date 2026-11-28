"use client"

import { useEffect, useId, useRef, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { CandidateNotificationFeedback, getNotificationFeedback } from '@/components/candidate-notification-feedback'
import { getNotificationRecipients, sendCandidateNotification, type NotificationRecipient, type NotificationResult } from '@/services/candidate-notification-service'

export function CandidateNotificationDialog({ jobId, jobTitle, cycle = 1, candidateId, closeJob, onClose }: {
  jobId: string; jobTitle: string; cycle?: number; candidateId?: string; closeJob?: () => Promise<void>; onClose: () => void
}) {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([])
  const [loadFailed, setLoadFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notify, setNotify] = useState(true)
  const [subject, setSubject] = useState(closeJob ? `Atualização sobre a vaga ${jobTitle}`.slice(0, 200) : `Sobre sua candidatura — ${jobTitle}`.slice(0, 200))
  const [text, setText] = useState(closeJob ? `Olá!\n\nO processo seletivo para a vaga ${jobTitle} foi encerrado. Agradecemos seu interesse e sua participação.\n\nEquipe de recrutamento` : `Olá!\n\nTemos uma atualização sobre sua candidatura para a vaga ${jobTitle}.\n\nEquipe de recrutamento`)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [closed, setClosed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<NotificationRecipient & NotificationResult>>([])
  const inFlight = useRef(false)
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => { previousFocus?.focus() }
  }, [])

  useEffect(() => {
    let active = true
    getNotificationRecipients(jobId, cycle).then(items => {
      const selected = candidateId ? items.filter(item => item.id === candidateId) : items
      if (candidateId && selected.length === 0) throw new Error('Candidatura não encontrada nesta vaga.')
      if (active) setRecipients(selected)
    }).catch(() => {
      if (active) {
        setLoadFailed(true)
        setError('Não foi possível carregar os destinatários. Feche esta janela e tente novamente. Se o problema continuar, entre em contato com o suporte.')
      }
    })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [candidateId, jobId, cycle])

  async function submit() {
    if (inFlight.current || done) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    try {
      if (closeJob && !closed) { await closeJob(); setClosed(true) }
      if (notify) {
        // Small batches keep each server request bounded; no automatic retries.
        for (let index = 0; index < recipients.length; index += 3) {
          const batch = await Promise.all(recipients.slice(index, index + 3).map(async recipient => ({
            ...recipient,
            ...(recipient.hasEmail ? await sendCandidateNotification(jobId, recipient.id, subject, text, cycle)
              : { status: 'skipped' as const, message: 'Candidato sem e-mail.' }),
          })))
          setResults(previous => [...previous, ...batch])
        }
      }
      setDone(true)
    } catch { setError(closeJob && !closed
      ? 'Não foi possível encerrar a vaga. Nenhum e-mail foi enviado. Tente novamente mais tarde.'
      : 'Não foi possível concluir a ação. Se o problema continuar, entre em contato com o suporte.') }
    finally { inFlight.current = false; setBusy(false) }
  }

  const title = closeJob ? 'Encerrar vaga' : 'Enviar e-mail ao candidato'
  const showWarning = Boolean(error) || (done && notify && getNotificationFeedback(results).warning)
  const invalidMessage = notify && (!subject.trim() || !text.trim() || /[\r\n\x00]/.test(subject) || new TextEncoder().encode(text).length > 51200)
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.stopPropagation(); if (!busy) onClose() }
          if (event.key === 'Tab') {
            const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')
            const first = controls?.[0]
            const last = controls?.[controls.length - 1]
            if (!first || !last) { event.preventDefault(); return }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus() }
          }
        }}
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border-t-4 bg-white p-6 shadow-xl outline-none ${showWarning ? 'border-amber-400' : done ? 'border-emerald-500' : 'border-orange-500'}`}>
        <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-gray-600">{jobTitle}</p>
        {closeJob && !closed ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">Ao encerrar, os candidatos pendentes sairão da pipeline e terão o encerramento registrado no histórico. Contratados e rejeitados permanecerão somente para consulta.</p> : null}
        {closeJob && !done ? <label className="mt-4 flex items-center gap-2"><input type="checkbox" checked={notify} disabled={busy} onChange={e => setNotify(e.target.checked)} />Notificar todos os candidatos por e-mail</label> : null}
        {notify && !done ? <>
          <p className="mt-4 text-sm">{loading ? 'Consultando destinatários...' : `${recipients.length} candidato(s); ${recipients.filter(item => !item.hasEmail).length} sem e-mail.`}</p>
          {candidateId ? <p className="text-sm font-semibold">{recipients[0]?.name}</p> : null}
          <label className="mt-4 block text-sm font-semibold" htmlFor="notification-subject">Assunto</label>
          <input id="notification-subject" value={subject} maxLength={200} disabled={busy} onChange={e => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border p-2" />
          <label className="mt-4 block text-sm font-semibold" htmlFor="notification-text">Mensagem</label>
          <textarea id="notification-text" value={text} disabled={busy} onChange={e => setText(e.target.value)} rows={7} className="mt-1 w-full rounded-lg border p-2" />
          <p className="mt-2 text-xs text-gray-600">Cada candidato recebe uma mensagem individual. Revise o assunto e a mensagem antes de enviar. Limite: 50 KB.</p>
        </> : null}
        {closed ? <p role="status" className="mt-4 font-semibold text-green-800">Vaga encerrada com sucesso.</p> : null}
        {busy && notify ? <p role="status" className="mt-3">Processando e-mails: {results.length}/{recipients.length}. Aguarde antes de sair desta página.</p> : null}
        {done && notify ? <CandidateNotificationFeedback results={results} /> : null}
        {error ? <div role="alert" className="mt-5 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0" />
          <div><h3 className="font-semibold">{loadFailed ? 'Destinatários indisponíveis' : closeJob && !closed ? 'Não foi possível encerrar a vaga' : 'Não foi possível concluir a ação'}</h3><p className="mt-2 text-sm leading-relaxed">{error}</p></div>
        </div> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border px-4 py-2 disabled:opacity-50">{done ? 'Fechar' : 'Cancelar'}</button>
          {!done ? <button type="button" onClick={() => void submit()} disabled={busy || Boolean(invalidMessage) || (notify && (loading || loadFailed || (!closeJob && !recipients.some(r => r.hasEmail))))} className="rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? 'Processando...' : closeJob ? notify ? 'Encerrar e notificar' : 'Confirmar encerramento' : 'Enviar e-mail'}</button> : null}
        </div>
      </section>
    </div>
  )
}
