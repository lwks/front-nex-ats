import { describe, expect, it, vi } from 'vitest'
const auth = vi.hoisted(() => ({ requireAccountType: vi.fn() }))
vi.mock('@/lib/auth/supabase-server', () => auth)
vi.mock('@/components/candidate-applications', () => ({ CandidateApplications: () => <div /> }))
import MyApplicationsPage from '@/app/minhas-candidaturas/page'
describe('candidate history page access', () => {
  it('requires candidate authorization and preserves the destination for login', async () => {
    await MyApplicationsPage()
    expect(auth.requireAccountType).toHaveBeenCalledWith('CANDIDATE', '/minhas-candidaturas')
  })
  it('does not render when authorization fails', async () => {
    auth.requireAccountType.mockRejectedValueOnce(new Error('denied'))
    await expect(MyApplicationsPage()).rejects.toThrow('denied')
  })
})
