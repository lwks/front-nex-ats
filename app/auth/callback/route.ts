import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { accountTypeFromClaims, authPagePath, destinationAfterSignIn, supabaseConfig } from '@/lib/auth/supabase'
import { publicRedirectUrl } from '@/lib/auth/public-redirect'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const recovery = request.nextUrl.searchParams.get('next') === 'recover'
  const requestedPath = request.nextUrl.searchParams.get('next')
  const config = supabaseConfig()
  if (!code || !config) return NextResponse.redirect(publicRedirectUrl(request, `${authPagePath('login', requestedPath)}&error=callback`))

  const response = NextResponse.redirect(publicRedirectUrl(request, '/'))
  const client = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value))
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { error } = await client.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(publicRedirectUrl(request, `${authPagePath('login', requestedPath)}&error=callback`))
  const { data } = await client.auth.getClaims()
  const type = accountTypeFromClaims(data?.claims)
  const target = recovery ? '/?mode=recover' : type ? destinationAfterSignIn(type, requestedPath) : authPagePath('complete', requestedPath)
  const destination = NextResponse.redirect(publicRedirectUrl(request, target))
  response.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie))
  return destination
}
