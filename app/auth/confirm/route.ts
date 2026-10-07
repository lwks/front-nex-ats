import { createServerClient } from '@supabase/ssr'
import type { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseConfig } from '@/lib/auth/supabase'

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  const type = request.nextUrl.searchParams.get('type')
  const config = supabaseConfig()
  if (!config || !tokenHash || (type !== 'email' && type !== 'recovery')) {
    return NextResponse.redirect(new URL('/?error=confirmation', request.url))
  }

  const response = NextResponse.redirect(new URL(type === 'recovery' ? '/?mode=recover' : '/?mode=complete', request.url))
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
  if (error) return NextResponse.redirect(new URL('/?error=confirmation', request.url))
  return response
}
