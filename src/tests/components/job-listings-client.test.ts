import { describe, expect, it } from 'vitest'

import {
  BLOCKED_MODULE_LABELS,
  JOBS_PER_PAGE,
  deriveCandidateMetrics,
  getPageCount,
  getPaginatedJobs,
  type JobCard,
} from '@/components/job-listings-client'

function createJob(id: string, jobGuid = id): JobCard {
  return {
    id,
    jobGuid,
    title: `Vaga ${id}`,
    company: 'NexJob',
    location: 'Sao Paulo/SP',
    workType: 'CLT',
    description: 'Descricao da vaga',
    applyHref: `/candidaturas?vagaGuid=${jobGuid}`,
    isExternal: false,
    companyDetails: {},
  }
}

describe('ATS job listings helpers', () => {
  it('keeps the ATS page size at 3 jobs', () => {
    expect(JOBS_PER_PAGE).toBe(3)
  })

  it('paginates 7 jobs into 3 pages with 3 visible jobs per full page', () => {
    const jobs = Array.from({ length: 7 }, (_, index) => createJob(`job-${index + 1}`))

    expect(getPageCount(jobs.length)).toBe(3)
    expect(getPaginatedJobs(jobs, 1).map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3'])
    expect(getPaginatedJobs(jobs, 2).map((job) => job.id)).toEqual(['job-4', 'job-5', 'job-6'])
    expect(getPaginatedJobs(jobs, 3).map((job) => job.id)).toEqual(['job-7'])
  })

  it('clamps invalid pages to the closest valid page', () => {
    const jobs = [createJob('job-1'), createJob('job-2'), createJob('job-3'), createJob('job-4')]

    expect(getPaginatedJobs(jobs, 0).map((job) => job.id)).toEqual(['job-1', 'job-2', 'job-3'])
    expect(getPaginatedJobs(jobs, 99).map((job) => job.id)).toEqual(['job-4'])
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

  it('keeps unavailable modules listed as blocked modules', () => {
    expect(BLOCKED_MODULE_LABELS).toEqual(['Performance', 'Estudos', 'Parceiros'])
  })
})
