import { NextRequest, NextResponse } from 'next/server'
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_STATE_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
  buildTokenRequestBody,
  clearAuthFlowCookies,
  getCognitoClientId,
  getCognitoDomain,
  getCookieBaseOptions,
  getRedirectUri,
} from '../../../../lib/auth/cognito'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const returnedState = request.nextUrl.searchParams.get('state')
  const savedState = request.cookies.get(AUTH_STATE_COOKIE)?.value
  const codeVerifier = request.cookies.get(AUTH_CODE_VERIFIER_COOKIE)?.value
  const clientId = getCognitoClientId()
  const secure = request.nextUrl.protocol === 'https:' || process.env.NODE_ENV === 'production'

  if (!code || !returnedState) {
    return NextResponse.json(
      { message: 'Parâmetros code e state são obrigatórios no callback.' },
      { status: 400 },
    )
  }

  if (!savedState || returnedState !== savedState) {
    return NextResponse.json(
      { message: 'State inválido ou expirado.' },
      { status: 400 },
    )
  }

  if (!codeVerifier) {
    return NextResponse.json(
      { message: 'Code verifier ausente ou expirado.' },
      { status: 400 },
    )
  }

  if (!clientId) {
    return NextResponse.json(
      { message: 'COGNITO_CLIENT_ID não configurado.' },
      { status: 500 },
    )
  }

  const redirectUri = getRedirectUri(request.nextUrl.origin)
  const tokenResponse = await fetch(`${getCognitoDomain()}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildTokenRequestBody({
      clientId,
      code,
      redirectUri,
      codeVerifier,
    }).toString(),
    cache: 'no-store',
  }).catch(async (error: unknown) => {
    console.error('Erro ao trocar authorization code por tokens no Cognito.', error)
    return NextResponse.json({ message: 'Falha ao comunicar com o Cognito.' }, { status: 502 })
  })

  if (tokenResponse instanceof NextResponse) {
    clearAuthFlowCookies(tokenResponse, secure)
    return tokenResponse
  }

  const responseBody = await tokenResponse.json().catch(() => null)

  if (!tokenResponse.ok || !responseBody?.access_token || !responseBody?.id_token) {
    const errorResponse = NextResponse.json(
      {
        message: 'Falha ao obter tokens do Cognito.',
        details: responseBody,
      },
      { status: tokenResponse.status || 502 },
    )

    clearAuthFlowCookies(errorResponse, secure)
    return errorResponse
  }

  const expiresIn = Number(responseBody.expires_in ?? 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : ''
  const response = NextResponse.redirect(new URL('/', request.nextUrl))
  const baseOptions = getCookieBaseOptions(secure)

  response.cookies.set(ACCESS_TOKEN_COOKIE, responseBody.access_token, {
    ...baseOptions,
    maxAge: expiresIn > 0 ? expiresIn : undefined,
  })
  response.cookies.set(ID_TOKEN_COOKIE, responseBody.id_token, {
    ...baseOptions,
    maxAge: expiresIn > 0 ? expiresIn : undefined,
  })

  if (responseBody.refresh_token) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, responseBody.refresh_token, baseOptions)
  }

  if (expiresAt) {
    response.cookies.set(TOKEN_EXPIRES_AT_COOKIE, expiresAt, {
      ...baseOptions,
      maxAge: expiresIn,
    })
  }

  clearAuthFlowCookies(response, secure)

  return response
}
