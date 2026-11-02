import { NextResponse } from 'next/server'
import { isLocalHarness } from '@/lib/local-harness'

export async function GET() {
  return isLocalHarness()
    ? NextResponse.json({ service: 'ats-local-front', mode: 'local' })
    : NextResponse.json({ message: 'Not found' }, { status: 404 })
}
