import { NextResponse } from "next/server"

import { exchangeCodeForToken } from "@/services/auth-service"

const STATE_COOKIE_NAME = "auth_state"
const CODE_VERIFIER_COOKIE_NAME = "auth_code_verifier"
const ACCESS_TOKEN_COOKIE_NAME = "auth_access_token"
const ID_TOKEN_COOKIE_NAME = "auth_id_token"
const REFRESH_TOKEN_COOKIE_NAME = "auth_refresh_token"
const CALLBACK_ERROR_REDIRECT = "/login?error=auth_callback_failed"
const SUCCESS_REDIRECT = "/"

function buildSessionCookieOptions(request: Request, maxAge?: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax" as const,
    secure: new URL(request.url).protocol === "https:",
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (!code || !state) {
    return NextResponse.redirect(new URL(CALLBACK_ERROR_REDIRECT, request.url))
  }

  const stateCookie = request.headers.get("cookie")
    ?.split(/;\s*/)
    .find((value) => value.startsWith(`${STATE_COOKIE_NAME}=`))
    ?.split("=")[1]
  const codeVerifier = request.headers.get("cookie")
    ?.split(/;\s*/)
    .find((value) => value.startsWith(`${CODE_VERIFIER_COOKIE_NAME}=`))
    ?.split("=")[1]

  if (!stateCookie || !codeVerifier || stateCookie !== state) {
    return NextResponse.redirect(new URL(CALLBACK_ERROR_REDIRECT, request.url))
  }

  try {
    const tokens = await exchangeCodeForToken(code, codeVerifier)
    const response = NextResponse.redirect(new URL(SUCCESS_REDIRECT, request.url))
    const cookieOptions = buildSessionCookieOptions(request, tokens.expires_in)

    response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.access_token, cookieOptions)

    if (tokens.id_token) {
      response.cookies.set(ID_TOKEN_COOKIE_NAME, tokens.id_token, cookieOptions)
    }

    if (tokens.refresh_token) {
      response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      })
    }

    response.cookies.delete(STATE_COOKIE_NAME)
    response.cookies.delete(CODE_VERIFIER_COOKIE_NAME)

    return response
  } catch (error) {
    console.error("Erro ao concluir callback do Cognito:", error)
    return NextResponse.redirect(new URL(CALLBACK_ERROR_REDIRECT, request.url))
  }
}
