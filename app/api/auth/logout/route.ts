import { NextRequest, NextResponse } from 'next/server'
import {
  buildLogoutUrl,
  clearAllAuthCookies,
  getCognitoClientId,
  getCognitoDomain,
  getLogoutRedirectUri,
} from '../../../../lib/auth/cognito'

export async function GET(request: NextRequest) {
  const secure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production'
  const clientId = getCognitoClientId()
  const shouldUseHostedUiLogout = Boolean(process.env.COGNITO_LOGOUT_URI ?? process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI) && Boolean(clientId)
  const location = shouldUseHostedUiLogout
    ? buildLogoutUrl({
        cognitoDomain: getCognitoDomain(),
        clientId: clientId!,
        logoutUri: getLogoutRedirectUri(request.nextUrl.origin),
      })
    : new URL('/', request.nextUrl).toString()

  const response = NextResponse.redirect(location)
  clearAllAuthCookies(response, secure)

  return response
}
