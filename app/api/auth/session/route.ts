import { NextRequest, NextResponse } from 'next/server'
import { ACCESS_TOKEN_COOKIE, ID_TOKEN_COOKIE, TOKEN_EXPIRES_AT_COOKIE, getSessionState } from '../../../../lib/auth/cognito'

export async function GET(request: NextRequest) {
  const session = getSessionState({
    accessToken: request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    idToken: request.cookies.get(ID_TOKEN_COOKIE)?.value ?? null,
    expiresAt: request.cookies.get(TOKEN_EXPIRES_AT_COOKIE)?.value ?? null,
  })

  return NextResponse.json(session)
}
