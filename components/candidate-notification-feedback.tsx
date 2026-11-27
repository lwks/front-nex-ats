import { CircleCheck, TriangleAlert } from 'lucide-react'
import type { NotificationRecipient, NotificationResult } from '@/services/candidate-notification-service'

export type CandidateNotificationResult = NotificationRecipient & NotificationResult

const resultLabels: Record<NotificationResult['status'], string> = {
  accepted: 'Mensagem encaminhada para envio.',
  failed: 'Não foi possível enviar a mensagem.',
  unknown: 'Não foi possível confirmar o envio.',
  skipped: 'Mensagem não enviada: candidato sem e-mail cadastrado.',
}

export function getNotificationFeedback(results: CandidateNotificationResult[]) {
  const sent = results.filter(result => result.status === 'accepted').length
  const failed = results.filter(result => result.status === 'failed').length
  const unknown = results.filter(result => result.status === 'unknown').length
  const skipped = results.filter(result => result.status === 'skipped').length
  const warning = results.length === 0 || sent !== results.length

  let title = results.length === 1 ? 'E-mail encaminhado' : 'E-mails encaminhados'
  let description = results.length === 1
    ? `A mensagem para ${results[0].name} foi encaminhada para envio.`
    : `${sent} mensagens foram encaminhadas para envio.`

  if (warning) {
    title = sent ? 'Alguns e-mails precisam de atenção'
      : unknown === results.length && unknown > 0 ? 'Não foi possível confirmar os envios'
        : skipped === results.length && skipped > 0 ? 'Candidatos sem e-mail cadastrado'
          : 'Não foi possível enviar os e-mails'
    description = [
      sent ? `${sent} ${sent === 1 ? 'mensagem encaminhada' : 'mensagens encaminhadas'} para envio.` : '',
      failed ? `${failed} ${failed === 1 ? 'mensagem não enviada' : 'mensagens não enviadas'}.` : '',
      unknown ? `Não foi possível confirmar o envio de ${unknown} ${unknown === 1 ? 'mensagem' : 'mensagens'}.` : '',
      skipped ? `${skipped} ${skipped === 1 ? 'candidato' : 'candidatos'} sem e-mail cadastrado.` : '',
    ].filter(Boolean).join(' ') || 'Nenhuma mensagem foi enviada.'

    if (results.length === 1) {
      const result = results[0]
      title = result.status === 'unknown' ? 'Não foi possível confirmar o envio'
        : result.status === 'skipped' ? 'Candidato sem e-mail cadastrado'
          : 'Não foi possível enviar o e-mail'
      description = result.status === 'unknown'
        ? `Não recebemos a confirmação do envio da mensagem para ${result.name}.`
        : result.status === 'skipped'
          ? `A mensagem para ${result.name} não foi enviada porque não há um e-mail cadastrado.`
          : `A mensagem para ${result.name} não foi enviada. Tente novamente mais tarde. Se o problema continuar, entre em contato com o suporte.`
    }
  }

  return { title, description, warning, hasUnconfirmed: unknown > 0, hasSent: sent > 0 }
}

export function CandidateNotificationFeedback({ results }: { results: CandidateNotificationResult[] }) {
  const feedback = getNotificationFeedback(results)
  const Icon = feedback.warning ? TriangleAlert : CircleCheck
  return (
    <div role={feedback.warning ? 'alert' : 'status'} className={`mt-5 rounded-xl border p-5 ${feedback.warning ? 'border-amber-300 bg-amber-50 text-amber-950' : 'border-emerald-200 bg-emerald-50 text-emerald-950'}`}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0" />
        <div className="min-w-0 space-y-2">
          <h3 className="text-base font-semibold">{feedback.title}</h3>
          <p className="text-sm leading-relaxed">{feedback.description}</p>
          {feedback.hasUnconfirmed ? <p className="text-sm font-medium leading-relaxed">A mensagem pode ter sido enviada. Antes de reenviar, confirme com o destinatário para evitar mensagens duplicadas.</p> : null}
          {feedback.hasSent ? <p className="text-xs leading-relaxed">A entrega pode levar alguns minutos. O sistema não confirma o recebimento na caixa de entrada.</p> : null}
        </div>
      </div>
      {results.length > 1 ? <ul aria-label="Resultado por candidato" className="mt-4 space-y-2 border-t border-current/15 pt-4 text-sm">{results.map(result => <li key={result.id}><span className="font-semibold">{result.name}:</span> {resultLabels[result.status]}</li>)}</ul> : null}
    </div>
  )
}
