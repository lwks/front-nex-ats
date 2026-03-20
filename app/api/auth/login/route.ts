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
import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import { buildAuthorizeUrl, generateCodeChallenge, generateCodeVerifier } from "@/services/auth-service"

const STATE_COOKIE_NAME = "auth_state"
const CODE_VERIFIER_COOKIE_NAME = "auth_code_verifier"
const COOKIE_MAX_AGE_IN_SECONDS = 60 * 10

function buildCookieOptions(request: Request) {
  return {
    httpOnly: true,
    maxAge: COOKIE_MAX_AGE_IN_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: new URL(request.url).protocol === "https:",
  }
}

export async function GET(request: Request) {
  const codeVerifier = generateCodeVerifier()
  const codeChallenge = await generateCodeChallenge(codeVerifier)
  const state = randomUUID()
  const authorizeUrl = await buildAuthorizeUrl({ codeChallenge, state })

  const response = NextResponse.redirect(authorizeUrl)
  const cookieOptions = buildCookieOptions(request)

  response.cookies.set(STATE_COOKIE_NAME, state, cookieOptions)
  response.cookies.set(CODE_VERIFIER_COOKIE_NAME, codeVerifier, cookieOptions)

  return response
}
