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
