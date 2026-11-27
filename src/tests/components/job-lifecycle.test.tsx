import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { ApplicationBoard, type Application } from '@/components/application-board'
import { CandidateApplicationsList } from '@/components/candidate-applications'

const person: Application = { id: 'person', nome: 'Pessoa Teste', status: 'contratado', ciclo: 1 }

describe('cycle visibility and interaction', () => {
  it('keeps closed vacancy cards focusable for consultation while disabling drag and changing the cursor', () => {
    const html = renderToStaticMarkup(<ApplicationBoard candidaturas={[person]} draggable={false} onApplicationSelect={vi.fn()} />)
    expect(html).toContain('draggable="false"')
    expect(html).toContain('cursor-not-allowed')
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('Vaga encerrada: movimentação bloqueada')
    expect(html).toContain('Somente consulta')
  })

  it('keeps previous cycle results blocked when the vacancy is reopened', () => {
    const html = renderToStaticMarkup(<ApplicationBoard candidaturas={[{ ...person, cicloAnterior: true, somenteLeitura: true }]} draggable onApplicationSelect={vi.fn()} />)
    expect(html).toContain('Ciclo anterior')
    expect(html).toContain('draggable="false"')
    expect(html).toContain('Ciclo encerrado: movimentação bloqueada')
    expect(html).not.toContain('cursor-grab ')
  })

  it('allows movements only for a current-cycle application', () => {
    const html = renderToStaticMarkup(<ApplicationBoard candidaturas={[{ ...person, ciclo: 2, status: 'novos' }]} draggable />)
    expect(html).toContain('draggable="true"')
    expect(html).toContain('cursor-grab')
    expect(html).not.toContain('Ciclo anterior')
  })

  it('keeps the previous process visibly ended when the vacancy is open again', () => {
    const html = renderToStaticMarkup(<CandidateApplicationsList items={[{
      id: 'old', jobGuid: 'job', title: 'Original title', company: '', ciclo: 1,
      jobStatus: 'Encerrada', currentJobStatus: 'Aberto', status: 'Proposta', createdAt: '', closedAt: '2026-01-01',
      historico: [{ tipo: 'REMOVIDA_POR_ENCERRAMENTO', ciclo: 1, data: '2026-01-01', etapa: 'Proposta', mensagem: 'Candidatura removida da seleção.' }],
    }]} />)
    expect(html).toContain('Candidatura removida da seleção.')
    expect(html).toContain('Esta inscrição permanece encerrada')
    expect(html).toContain('Encerrada</strong>')
  })
})
