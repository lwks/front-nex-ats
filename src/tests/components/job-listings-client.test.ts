import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import {
  BLOCKED_MODULE_LABELS,
  JOBS_PER_PAGE,
  JobListingsClient,
  deriveCandidateMetrics,
  filterJobs,
  getCandidateTotalForJobs,
  getPageCount,
  getPaginatedJobs,
  type JobCard,
} from '@/components/job-listings-client'

function createJob(id: string, jobGuid = id): JobCard {
  return {
    id,
    jobGuid,
    title: `Vaga ${id}`,
    company: 'ClusterHR',
    location: 'Sao Paulo/SP',
    state: 'SP',
    technicalSkills: ['Python', 'Angular'],
    workType: 'CLT',
    description: 'Descricao da vaga',
    applyHref: `/candidaturas?vagaGuid=${jobGuid}`,
    isExternal: false,
    companyDetails: {},
  }
}

describe('ATS job listings helpers', () => {
  it('keeps the ATS page size at 6 jobs', () => {
    expect(JOBS_PER_PAGE).toBe(6)
  })

  it('paginates 7 jobs into 2 pages with 6 visible jobs on the first page', () => {
    const jobs = Array.from({ length: 7 }, (_, index) => createJob(`job-${index + 1}`))

    expect(getPageCount(jobs.length)).toBe(2)
    expect(getPaginatedJobs(jobs, 1).map((job) => job.id)).toEqual([
      'job-1',
      'job-2',
      'job-3',
      'job-4',
      'job-5',
      'job-6',
    ])
    expect(getPaginatedJobs(jobs, 2).map((job) => job.id)).toEqual(['job-7'])
  })

  it('clamps invalid pages to the closest valid page', () => {
    const jobs = [createJob('job-1'), createJob('job-2'), createJob('job-3'), createJob('job-4')]

    expect(getPaginatedJobs(jobs, 0).map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3', 'job-4'])
    expect(getPaginatedJobs(jobs, 99).map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3', 'job-4'])
  })

  it('derives total and per-job candidate counts from guid_vaga', () => {
    const jobs = [createJob('job-1', 'vaga-1'), createJob('job-2', 'vaga-2')]
    const payload = {
      data: [
        { id: 'cand-1', guid_vaga: 'vaga-1' },
        { id: 'cand-2', guid_vaga: 'vaga-1' },
        { id: 'cand-3', jobGuid: 'vaga-2' },
        { id: 'cand-4', guid_vaga: 'vaga-unknown' },
      ],
    }

    expect(deriveCandidateMetrics(payload, jobs)).toEqual({
      totalCandidates: 4,
      byJobId: {
        'job-1': 2,
        'job-2': 1,
      },
    })
  })

  it('does not render candidate application CTAs in the ATS business view', () => {
    const html = renderToStaticMarkup(
      createElement(JobListingsClient, {
        jobs: [createJob('job-1')],
      }),
    )

    expect(html).toContain('Ver detalhes')
    expect(html).not.toContain('Candidatar-se')
  })

  it('renders only one create-job CTA in the ATS business view', () => {
    const html = renderToStaticMarkup(
      createElement(JobListingsClient, {
        jobs: [createJob('job-1')],
      }),
    )

    expect(html.match(/href="\/jobs\/create"/g)).toHaveLength(1)
  })

  it('calculates the candidate metric for the currently filtered jobs', () => {
    const jobs = [
      { ...createJob('job-1'), title: 'Desenvolvedor Python' },
      { ...createJob('job-2'), title: 'Analista de Dados', technicalSkills: ['SQL'] },
      { ...createJob('job-3'), title: 'UX Designer', technicalSkills: ['Figma'] },
    ]
    const filtered = filterJobs(jobs, 'python')

    expect(getCandidateTotalForJobs(filtered, {
      'job-1': 3,
      'job-2': 5,
      'job-3': 2,
    })).toBe(3)
  })

  it('filters jobs by title or description', () => {
    const jobs = [
      { ...createJob('job-1'), title: 'Desenvolvedor Python', description: 'APIs e automacao', technicalSkills: ['Python'] },
      { ...createJob('job-2'), title: 'Analista de Dados', description: 'Dashboards em Power BI', technicalSkills: ['SQL'] },
      { ...createJob('job-3'), title: 'UX Designer', description: 'Pesquisa com candidatos', technicalSkills: ['Figma'] },
    ]

    expect(filterJobs(jobs, 'python').map((job) => job.id)).toEqual(['job-1'])
    expect(filterJobs(jobs, 'power bi').map((job) => job.id)).toEqual(['job-2'])
    expect(filterJobs(jobs, 'automação').map((job) => job.id)).toEqual(['job-1'])
    expect(filterJobs(jobs, 'figma').map((job) => job.id)).toEqual(['job-3'])
    expect(filterJobs(jobs, 'sp').map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3'])
    expect(filterJobs(jobs, '  ').map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3'])
  })

  it('keeps unavailable modules listed as blocked modules', () => {
    expect(BLOCKED_MODULE_LABELS).toEqual(['Performance', 'Estudos', 'Parceiros'])
  })
})
