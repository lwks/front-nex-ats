import { NextResponse } from "next/server"

type OAuthTokenResponse = {
  access_token?: string
  expires_in?: number
  refresh_token?: string
  refresh_expires_in?: number
  id_token?: string
}

const CALLBACK_PATH = "/api/auth/callback"
const DEFAULT_SUCCESS_PATH = "/"
const DEFAULT_ERROR_PATH = "/login"

const TRANSIENT_COOKIE_NAMES = {
  state: "auth_state",
  codeVerifier: "auth_code_verifier",
} as const

const TOKEN_COOKIE_NAMES = {
  accessToken: "auth_access_token",
  refreshToken: "auth_refresh_token",
  idToken: "auth_id_token",
} as const

function buildErrorRedirect(request: Request, message: string) {
  const url = new URL(process.env.AUTH_ERROR_REDIRECT_PATH ?? DEFAULT_ERROR_PATH, request.url)
  url.searchParams.set("message", message)
  return url
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

function clearTransientCookies(response: NextResponse) {
  clearCookie(response, TRANSIENT_COOKIE_NAMES.state)
  clearCookie(response, TRANSIENT_COOKIE_NAMES.codeVerifier)
}

function clearAuthCookies(response: NextResponse) {
  clearCookie(response, TOKEN_COOKIE_NAMES.accessToken)
  clearCookie(response, TOKEN_COOKIE_NAMES.refreshToken)
  clearCookie(response, TOKEN_COOKIE_NAMES.idToken)
}

function redirectWithError(request: Request, message: string) {
  const response = NextResponse.redirect(buildErrorRedirect(request, message))
  clearTransientCookies(response)
  clearAuthCookies(response)
  return response
}

function getTokenCookieMaxAge(expiresIn?: number) {
  if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return undefined
  }

  return Math.floor(expiresIn)
}

function setSecureCookie(response: NextResponse, name: string, value: string, maxAge?: number) {
  response.cookies.set({
    name,
    value,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    ...(typeof maxAge === "number" ? { maxAge } : {}),
  })
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

function getTokenEndpoint() {
  const issuerUrl = getRequiredEnv("AUTH_BASE_URL")

  if (!issuerUrl) {
    return undefined
  }

  return `${issuerUrl.replace(/\/+$/, "")}/oauth2/token`
}

function getRedirectUri(request: Request) {
  return getRequiredEnv("AUTH_REDIRECT_URI") ?? new URL(CALLBACK_PATH, request.url).toString()
}

function createTokenExchangeRequest(request: Request, code: string, codeVerifier: string) {
  const clientId = getRequiredEnv("AUTH_CLIENT_ID")
  const tokenEndpoint = getTokenEndpoint()

  if (!clientId || !tokenEndpoint) {
    return undefined
  }

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: getRedirectUri(request),
    code_verifier: codeVerifier,
  })

  const clientSecret = getRequiredEnv("AUTH_CLIENT_SECRET")
  if (clientSecret) {
    params.set("client_secret", clientSecret)
  }

  return {
    tokenEndpoint,
    body: params.toString(),
  }
}

function getCookieValue(request: Request, name: string) {
  const requestWithCookies = request as Request & {
    cookies?: { get(name: string): { value: string } | undefined }
  }

  const cookieValue = requestWithCookies.cookies?.get(name)?.value
  if (cookieValue) {
    return cookieValue
  }

  const header = request.headers.get("cookie")
  if (!header) {
    return undefined
  }

  const cookies = header.split(/;\s*/).map((entry) => entry.split("="))
  const matchedCookie = cookies.find(([cookieName]) => cookieName === name)
  return matchedCookie?.slice(1).join("=")
}

function validateCallbackParams(request: Request, url: URL) {
  const oauthError = url.searchParams.get("error")
  const oauthErrorDescription = url.searchParams.get("error_description")

  if (oauthError) {
    return {
      ok: false as const,
      message: oauthErrorDescription ?? "Não foi possível concluir o login. Tente novamente.",
    }
  }

  const code = url.searchParams.get("code")
  const returnedState = url.searchParams.get("state")
  const cookieState = getCookieValue(request, TRANSIENT_COOKIE_NAMES.state)
  const codeVerifier = getCookieValue(request, TRANSIENT_COOKIE_NAMES.codeVerifier)

  if (!code) {
    return {
      ok: false as const,
      message: "Não recebemos o código de autorização. Faça login novamente.",
    }
  }

  if (!returnedState || !cookieState || returnedState !== cookieState) {
    return {
      ok: false as const,
      message: "A validação de segurança do login falhou. Faça login novamente.",
    }
  }

  if (!codeVerifier) {
    return {
      ok: false as const,
      message: "Sua sessão de login expirou. Faça login novamente.",
    }
  }

  return {
    ok: true as const,
    code,
    codeVerifier,
  }
}

async function exchangeAuthorizationCode(request: Request, code: string, codeVerifier: string) {
  const tokenExchange = createTokenExchangeRequest(request, code, codeVerifier)

  if (!tokenExchange) {
    throw new Error("OAuth configuration is incomplete.")
  }

  const upstreamResponse = await fetch(tokenExchange.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: tokenExchange.body,
    cache: "no-store",
  })

  if (!upstreamResponse.ok) {
    const responseText = await upstreamResponse.text()
    throw new Error(`Token endpoint returned ${upstreamResponse.status}: ${responseText}`)
  }

  return (await upstreamResponse.json()) as OAuthTokenResponse
}

function buildSuccessRedirect(request: Request) {
  return new URL(process.env.AUTH_SUCCESS_REDIRECT_PATH ?? DEFAULT_SUCCESS_PATH, request.url)
}

function buildSuccessResponse(request: Request, tokens: OAuthTokenResponse) {
  if (!tokens.access_token) {
    throw new Error("Token response is missing access_token.")
  }

  const response = NextResponse.redirect(buildSuccessRedirect(request))

  setSecureCookie(
    response,
    TOKEN_COOKIE_NAMES.accessToken,
    tokens.access_token,
    getTokenCookieMaxAge(tokens.expires_in),
  )

  if (tokens.refresh_token) {
    setSecureCookie(
      response,
      TOKEN_COOKIE_NAMES.refreshToken,
      tokens.refresh_token,
      getTokenCookieMaxAge(tokens.refresh_expires_in ?? tokens.expires_in),
    )
  }

  if (tokens.id_token) {
    setSecureCookie(
      response,
      TOKEN_COOKIE_NAMES.idToken,
      tokens.id_token,
      getTokenCookieMaxAge(tokens.expires_in),
    )
  }

  clearTransientCookies(response)
  return response
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const validation = validateCallbackParams(request, url)

  if (!validation.ok) {
    return redirectWithError(request, validation.message)
  }

  try {
    const tokens = await exchangeAuthorizationCode(request, validation.code, validation.codeVerifier)
    return buildSuccessResponse(request, tokens)
  } catch (error) {
    console.error("Erro ao concluir callback OAuth:", error)
    return redirectWithError(request, "Não foi possível concluir o login agora. Tente novamente.")
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const AUTH_CALLBACK_COOKIE_NAMES = {
  ...TRANSIENT_COOKIE_NAMES,
  ...TOKEN_COOKIE_NAMES,
}
