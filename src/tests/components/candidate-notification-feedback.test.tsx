import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CandidateNotificationFeedback, getNotificationFeedback, type CandidateNotificationResult } from '@/components/candidate-notification-feedback'

function result(status: CandidateNotificationResult['status'], id = 'synthetic-candidate'): CandidateNotificationResult {
  return { id, name: 'Pessoa de teste', hasEmail: status !== 'skipped', status, message: 'SMTP internal Brevo detail' }
}

describe('candidate notification feedback', () => {
  it('confirms submission without promising inbox delivery or exposing provider details', () => {
    const results = [result('accepted')]
    expect(getNotificationFeedback(results)).toMatchObject({ title: 'E-mail encaminhado', warning: false })
    const html = renderToStaticMarkup(createElement(CandidateNotificationFeedback, { results }))
    expect(html).toContain('role="status"')
    expect(html).toContain('Pessoa de teste')
    expect(html).toContain('não confirma o recebimento')
    expect(html).not.toMatch(/SMTP|Brevo|Aceitos:|Incertos:/)
  })

  it.each([
    ['failed', 'Não foi possível enviar o e-mail'],
    ['unknown', 'Não foi possível confirmar o envio'],
    ['skipped', 'Candidato sem e-mail cadastrado'],
  ] as const)('renders an amber warning for %s', (status, title) => {
    const results = [result(status)]
    expect(getNotificationFeedback(results)).toMatchObject({ title, warning: true })
    const html = renderToStaticMarkup(createElement(CandidateNotificationFeedback, { results }))
    expect(html).toContain('role="alert"')
    expect(html).toContain('bg-amber-50')
    expect(html).toContain(title)
    expect(html).not.toContain('SMTP internal Brevo detail')
    if (status === 'unknown') expect(html).toContain('evitar mensagens duplicadas')
  })

  it('explains partial results and identifies each candidate using business language', () => {
    const results = [result('accepted', 'sent'), result('unknown', 'unconfirmed'), result('skipped', 'no-email')]
    expect(getNotificationFeedback(results)).toMatchObject({ title: 'Alguns e-mails precisam de atenção', warning: true, hasUnconfirmed: true })
    const html = renderToStaticMarkup(createElement(CandidateNotificationFeedback, { results }))
    expect(html).toContain('Resultado por candidato')
    expect(html).toContain('Mensagem encaminhada para envio.')
    expect(html).toContain('Não foi possível confirmar o envio.')
    expect(html).toContain('candidato sem e-mail cadastrado')
  })

  it('does not claim success when there are no results', () => {
    expect(getNotificationFeedback([])).toMatchObject({ warning: true, description: 'Nenhuma mensagem foi enviada.', hasSent: false })
  })

  it('confirms all successful messages together', () => {
    expect(getNotificationFeedback([result('accepted', 'one'), result('accepted', 'two')])).toMatchObject({
      warning: false, title: 'E-mails encaminhados', description: '2 mensagens foram encaminhadas para envio.',
    })
  })
})
