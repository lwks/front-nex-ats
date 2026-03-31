import { NextRequest, NextResponse } from 'next/server'
import {
  buildCognitoTokenHeaders,
  buildRefreshTokenRequestBody,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  getCognitoClientId,
  getCognitoClientSecret,
  getCognitoDomain,
  getSessionState,
  setSessionCookies,
} from '../../../../lib/auth/cognito'

export async function POST(request: NextRequest) {
  const secure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production'
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
  const clientId = getCognitoClientId()
  const clientSecret = getCognitoClientSecret()

  if (!refreshToken) {
    const response = NextResponse.json({ authenticated: false, message: 'Refresh token ausente.' }, { status: 401 })
    clearSessionCookies(response, secure)
    return response
  }

  if (!clientId) {
    return NextResponse.json(
      { authenticated: false, message: 'COGNITO_CLIENT_ID não configurado.' },
      { status: 500 },
    )
  }

  const tokenResponse = await fetch(`${getCognitoDomain()}/oauth2/token`, {
    method: 'POST',
    headers: buildCognitoTokenHeaders({ clientId, clientSecret }),
    body: buildRefreshTokenRequestBody({
      clientId,
      refreshToken,
    }).toString(),
    cache: 'no-store',
  }).catch((error: unknown) => {
    console.error('Erro ao renovar a sessão no Cognito.', error)
    return NextResponse.json({ authenticated: false, message: 'Falha ao comunicar com o Cognito.' }, { status: 502 })
  })

  if (tokenResponse instanceof NextResponse) {
    clearSessionCookies(tokenResponse, secure)
    return tokenResponse
  }

  const responseBody = await tokenResponse.json().catch(() => null)

  if (!tokenResponse.ok || !responseBody?.access_token) {
    const status = tokenResponse.status >= 500 ? 502 : 401
    const response = NextResponse.json(
      {
        authenticated: false,
        message: status === 401 ? 'Não foi possível renovar a sessão.' : 'Falha ao renovar a sessão no Cognito.',
      },
      { status },
    )
    clearSessionCookies(response, secure)
    return response
  }

  const nextIdToken = typeof responseBody.id_token === 'string'
    ? responseBody.id_token
    : request.cookies.get(ID_TOKEN_COOKIE)?.value ?? null
  const expiresIn = Number(responseBody.expires_in ?? 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : ''
  const session = getSessionState({
    accessToken: responseBody.access_token,
    idToken: nextIdToken,
    expiresAt,
  })
  const response = NextResponse.json({ authenticated: session.authenticated, expiresAt: session.expiresAt }, { status: 200 })

  setSessionCookies(response, secure, {
    ...responseBody,
    id_token: nextIdToken ?? undefined,
    refresh_token: typeof responseBody.refresh_token === 'string' ? responseBody.refresh_token : undefined,
  })

  return response
}
