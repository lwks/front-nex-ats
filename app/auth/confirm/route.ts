import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfig } from '@/lib/auth/supabase'
import { publicRedirectUrl } from '@/lib/auth/public-redirect'

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const config = supabaseConfig()
  if (!config || !tokenHash || (type !== 'email' && type !== 'recovery')) {
    return NextResponse.redirect(publicRedirectUrl(request, '/?error=confirmation'))
  }

  const response = NextResponse.redirect(publicRedirectUrl(request, type === 'recovery' ? '/?mode=recover' : '/?mode=complete'))
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
  if (error) return NextResponse.redirect(publicRedirectUrl(request, '/?error=confirmation'))
  return response
}
