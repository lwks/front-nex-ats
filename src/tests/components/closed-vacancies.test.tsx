import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { PublicJobsBoardView, PublicJobDetailsModal } from '@/components/public-jobs-board'
import { CandidateApplicationsList } from '@/components/candidate-applications'
import { normalizeJobBoardJob } from '@/lib/job-board'

const open = normalizeJobBoardJob({ guid_id: '11111111-1111-4111-8111-111111111111', titulo: 'Aberta teste', status: 'Aberto' }, 0)
const closed = normalizeJobBoardJob({ guid_id: '22222222-2222-4222-8222-222222222222', titulo: 'Encerrada teste', status: 'Encerrada' }, 1)
const props = { jobs: [open, closed], query: '', onQueryChange: vi.fn(), selectedJob: null, onOpenJob: vi.fn(),
  onCloseJob: vi.fn(), onLoadMore: vi.fn(), isLoading: false, isLoadingMore: false, error: null, hasMore: false }

describe('closed vacancy visibility', () => {
  it('hides closed jobs by default and exposes an accessible archive filter', () => {
    const html = renderToStaticMarkup(<PublicJobsBoardView {...props} />)
    expect(html).toContain('Aberta teste')
    expect(html).not.toContain('Encerrada teste')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('Encerradas</button>')
    expect(html).toContain('Filtrar por status')
  })
  it('shows only archived jobs without an application link', () => {
    const html = renderToStaticMarkup(<PublicJobsBoardView {...props} jobStatus="closed" />)
    expect(html).toContain('Encerrada teste')
    expect(html).not.toContain('Aberta teste')
    expect(html).not.toContain('href="/candidaturas?')
    const modal = renderToStaticMarkup(<PublicJobDetailsModal job={closed} onClose={vi.fn()} />)
    expect(modal).toContain('não aceita mais candidaturas')
    expect(modal).not.toContain('href="/candidaturas?')
  })
  it('keeps candidate history readable without offering a new application', () => {
    const html = renderToStaticMarkup(<CandidateApplicationsList items={[{ id: 'own-1', jobGuid: closed.guid!,
      title: closed.title, company: '', status: 'Entrevista', jobStatus: 'Encerrada', createdAt: '', closedAt: null }]} />)
    expect(html).toContain('Entrevista')
    expect(html).toContain('Processo encerrado')
    expect(html).toContain('Ver detalhes da vaga')
    expect(html).not.toContain('/candidaturas?')
    expect(renderToStaticMarkup(<CandidateApplicationsList items={[]} />)).toContain('Nenhuma candidatura')
  })
})
