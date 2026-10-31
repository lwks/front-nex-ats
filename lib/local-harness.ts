/** Server-side only. A public flag must never enable local authentication. */
export function isLocalHarness(env = process.env): boolean {
  if (env.HARNESS_MODE !== 'local') return false
  if (!['development', 'test'].includes(env.NODE_ENV ?? '') || env.AWS_LAMBDA_FUNCTION_NAME || env.VERCEL || env.NETLIFY) {
    throw new Error('Local harness is forbidden in production/hosted runtimes')
  }
  for (const name of ['NEXT_PUBLIC_API_BASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'] as const) {
    const url = new URL(env[name] ?? '')
    if (url.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(url.hostname)) {
      throw new Error(`Local harness requires a loopback URL: ${name}`)
    }
  }
  return true
}
