import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'

export async function GET(request: NextRequest) {
  const client = await createSupabaseServerClient()
  if (client) await client.auth.signOut()
  return NextResponse.redirect(new URL('/', request.url))
}
