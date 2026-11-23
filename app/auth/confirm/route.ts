import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { authPagePath, candidateApplicationPath, supabaseConfig } from '@/lib/auth/supabase'
import { publicRedirectUrl } from '@/lib/auth/public-redirect'

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const requestedPath = candidateApplicationPath(request.nextUrl.searchParams.get('next'))
  const config = supabaseConfig()
  if (!config || !tokenHash || (type !== 'email' && type !== 'recovery')) {
    return NextResponse.redirect(publicRedirectUrl(request, `${authPagePath('login', requestedPath)}&error=confirmation`))
  }

  const target = type === 'recovery'
    ? `/?mode=recover${requestedPath ? `&next=${encodeURIComponent(requestedPath)}` : ''}`
    : authPagePath('complete', requestedPath)
  const response = NextResponse.redirect(publicRedirectUrl(request, target))
  const client = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value))
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })
  const { error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })
  if (error) return NextResponse.redirect(publicRedirectUrl(request, `${authPagePath('login', requestedPath)}&error=confirmation`))
  return response
}
