import { describe, expect, it } from 'vitest'
import { isLocalHarness } from '@/lib/local-harness'

describe('local harness isolation', () => {
  const local = { HARNESS_MODE: 'local', NODE_ENV: 'development', NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3001/api', NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54329' } as NodeJS.ProcessEnv
  it('is off unless explicitly requested', () => {
    expect(isLocalHarness({ NODE_ENV: 'development' })).toBe(false)
    expect(isLocalHarness(local)).toBe(true)
  })
  it('refuses production, hosted runtimes, missing config and remote services', () => {
    for (const overrides of [
      { NODE_ENV: 'production' }, { VERCEL: '1' }, { NETLIFY: 'true' }, { AWS_LAMBDA_FUNCTION_NAME: 'lambda' },
      { NEXT_PUBLIC_API_BASE_URL: 'https://real.lambda-url.on.aws/api' },
      { NEXT_PUBLIC_SUPABASE_URL: 'https://real.supabase.co' }, { NEXT_PUBLIC_API_BASE_URL: undefined },
    ]) expect(() => isLocalHarness({ ...local, ...overrides } as NodeJS.ProcessEnv)).toThrow()
  })
})
