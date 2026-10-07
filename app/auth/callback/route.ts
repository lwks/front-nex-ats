import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { accountTypeFromClaims, destinationForAccountType, supabaseConfig } from '@/lib/auth/supabase'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const recovery = request.nextUrl.searchParams.get('next') === 'recover'
  const config = supabaseConfig()
  if (!code || !config) return NextResponse.redirect(new URL('/?error=callback', request.url))

  const response = NextResponse.redirect(new URL('/', request.url))
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
  if (error) return NextResponse.redirect(new URL('/?error=callback', request.url))
  const { data } = await client.auth.getClaims()
  const type = accountTypeFromClaims(data?.claims)
  const target = recovery ? '/?mode=recover' : type ? destinationForAccountType(type) : '/?mode=complete'
  const destination = NextResponse.redirect(new URL(target, request.url))
  response.cookies.getAll().forEach((cookie) => destination.cookies.set(cookie))
  return destination
}
