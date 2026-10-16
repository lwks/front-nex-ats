import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  requireAccountType: vi.fn(),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`) }),
}))

vi.mock('@/lib/auth/supabase-server', () => ({ requireAccountType: auth.requireAccountType }))
vi.mock('next/navigation', () => ({ redirect: auth.redirect }))
vi.mock('@/components/candidate-onboarding', () => ({
  CandidateOnboarding: ({ jobGuid }: { jobGuid: string }) => <div data-job-guid={jobGuid} />,
}))

describe('candidate application page', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires candidate authorization and redirects when no vacancy is provided', async () => {
    const { default: CandidateApplicationPage } = await import('@/app/candidaturas/page')

    await expect(CandidateApplicationPage({ searchParams: Promise.resolve({}) }))
      .rejects.toThrow('REDIRECT:/jobs/list?notice=select-job')
    expect(auth.requireAccountType).toHaveBeenCalledWith('CANDIDATE')
  })

  it('passes the selected vacancy to the full candidate form', async () => {
    const { default: CandidateApplicationPage } = await import('@/app/candidaturas/page')
    const page = await CandidateApplicationPage({ searchParams: Promise.resolve({ vagaGuid: 'job-guid-1' }) })

    expect(page.props.jobGuid).toBe('job-guid-1')
  })

  it('accepts the legacy vaga query parameter', async () => {
    const { default: CandidateApplicationPage } = await import('@/app/candidaturas/page')
    const page = await CandidateApplicationPage({ searchParams: Promise.resolve({ vaga: 'legacy-job-guid' }) })

    expect(page.props.jobGuid).toBe('legacy-job-guid')
  })
})
