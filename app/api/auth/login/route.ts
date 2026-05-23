import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  AUTH_STATE_COOKIE,
  buildAuthorizeUrl,
  createCodeChallenge,
  generateRandomBase64Url,
  isAuthEnabled,
  getCognitoClientId,
  getCognitoDomain,
  getCognitoScope,
  getCookieBaseOptions,
  getRedirectUri,
} from '../../../../lib/auth/cognito'

export async function GET(request: NextRequest) {
  if (!isAuthEnabled(request.nextUrl.hostname)) {
    return NextResponse.redirect(new URL('/', request.nextUrl.origin))
  }

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

  console.log('Redirecting to Cognito authorize URL:', authorizeUrl)
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
