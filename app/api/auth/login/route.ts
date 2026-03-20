import { NextRequest, NextResponse } from 'next/server.js'
import {
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_STATE_COOKIE,
  buildAuthorizeUrl,
  createCodeChallenge,
  generateRandomBase64Url,
  getCognitoClientId,
  getCognitoDomain,
  getCognitoScope,
  getCookieBaseOptions,
  getRedirectUri,
} from '../../../../lib/auth/cognito.ts'

export async function GET(request: NextRequest) {
  const clientId = getCognitoClientId()

  if (!clientId) {
    return NextResponse.json(
      { message: 'COGNITO_CLIENT_ID não configurado.' },
      { status: 500 },
    )
  }

  const origin = request.nextUrl.origin
  const redirectUri = getRedirectUri(origin)
  const state = generateRandomBase64Url()
  const codeVerifier = generateRandomBase64Url(64)
  const authorizeUrl = buildAuthorizeUrl({
    cognitoDomain: getCognitoDomain(),
    clientId,
    redirectUri,
    scope: getCognitoScope(),
    state,
    codeChallenge: createCodeChallenge(codeVerifier),
  })

  const secure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production'
  const response = NextResponse.redirect(authorizeUrl)
  const cookieOptions = {
    ...getCookieBaseOptions(secure),
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  }

  response.cookies.set(AUTH_STATE_COOKIE, state, cookieOptions)
  response.cookies.set(AUTH_CODE_VERIFIER_COOKIE, codeVerifier, cookieOptions)

  return response
}
