import type { NextRequest } from 'next/server'

const PUBLIC_HOSTS = new Set(['clusterjobs.com.br', 'www.clusterjobs.com.br'])

export function publicRedirectUrl(request: NextRequest, path: string): URL {
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim().toLowerCase()
  const host = request.headers.get('host')?.toLowerCase()
  const publicHost = [forwardedHost, host].find((candidate) => candidate && PUBLIC_HOSTS.has(candidate))
  if (publicHost) return new URL(path, `https://${publicHost}`)
  if (request.nextUrl.hostname === '0.0.0.0') return new URL(path, 'https://clusterjobs.com.br')
  return new URL(path, request.url)
}
