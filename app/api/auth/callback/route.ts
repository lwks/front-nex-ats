import { NextResponse, type NextRequest } from 'next/server'
import { publicRedirectUrl } from '@/lib/auth/public-redirect'

export function GET(request: NextRequest) {
  return NextResponse.redirect(publicRedirectUrl(request, '/?error=old-callback'))
}
