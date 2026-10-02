import { describe, expect, it } from 'vitest'
import { accountTypeFromClaims, destinationForAccountType, pendingAccountTypeFromClaims } from '@/lib/auth/supabase'

describe('Supabase account type', () => {
  it('routes the two recognized account types', () => {
    expect(destinationForAccountType('CANDIDATE')).toBe('/jobs/list')
    expect(destinationForAccountType('COMPANY')).toBe('/empresa/candidaturas')
  })

  it('only authorizes app_metadata, not user-editable metadata', () => {
    const untrusted = { user_metadata: { account_type: 'COMPANY' } }
    expect(accountTypeFromClaims(untrusted as never)).toBeNull()
    expect(pendingAccountTypeFromClaims(untrusted as never)).toBe('COMPANY')
    expect(accountTypeFromClaims({ app_metadata: { account_type: 'UNKNOWN' } } as never)).toBeNull()
    expect(accountTypeFromClaims({ app_metadata: { account_type: 'CANDIDATE' } } as never)).toBe('CANDIDATE')
  })
})
