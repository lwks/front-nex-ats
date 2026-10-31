import { NextResponse } from 'next/server'
import { isLocalHarness } from '@/lib/local-harness'
import { createSupabaseServerClient } from '@/lib/auth/supabase-server'
import { destinationForAccountType } from '@/lib/auth/supabase'

export async function POST(request: Request) {
  if (!isLocalHarness()) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  // Forms work without client JS; only the local front may change its session.
  const url = new URL(request.url)
  const origin = request.headers.get('origin')
  if (!origin || origin !== url.origin || !['localhost', '127.0.0.1'].includes(url.hostname)) {
    return NextResponse.json({ message: 'Invalid local origin' }, { status: 403 })
  }
  const profile = (await request.formData()).get('profile')
  if (profile !== 'COMPANY' && profile !== 'CANDIDATE') {
    return NextResponse.json({ message: 'Invalid local profile' }, { status: 400 })
  }
  const client = await createSupabaseServerClient()
  if (!client) return NextResponse.json({ message: 'Local auth unavailable' }, { status: 503 })
  const { error } = await client.auth.signInWithPassword({
    email: `${profile.toLowerCase()}@example.com`, password: 'correct-password',
  })
  if (error) return NextResponse.json({ message: 'Local auth unavailable. Run npm run local:doctor.' }, { status: 503 })
  return NextResponse.redirect(new URL(destinationForAccountType(profile), url.origin), 303)
}
