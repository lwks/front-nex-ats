import { createHash, randomBytes } from 'node:crypto'

const DEFAULT_COGNITO_DOMAIN = 'https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com'
const DEFAULT_SCOPE = 'openid email profile'
const CALLBACK_PATH = '/api/auth/callback'
const DEFAULT_LOGOUT_REDIRECT_PATH = '/'

export const AUTH_STATE_COOKIE = 'nexjob_auth_state'
export const AUTH_CODE_VERIFIER_COOKIE = 'nexjob_code_verifier'
export const ACCESS_TOKEN_COOKIE = 'nexjob_access_token'
export const ID_TOKEN_COOKIE = 'nexjob_id_token'
export const REFRESH_TOKEN_COOKIE = 'nexjob_refresh_token'
export const TOKEN_EXPIRES_AT_COOKIE = 'nexjob_token_expires_at'
export const AUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60

export type JwtUser = {
  sub?: string
  email?: string
  name?: string
}

export type SessionState = {
  authenticated: boolean
  expiresAt: string | null
  user: JwtUser | null
}

export type CognitoTokenSuccessResponse = {
  access_token?: string
  id_token?: string
  refresh_token?: string
  expires_in?: number | string
}

function sanitizeUrl(rawUrl?: string): string | undefined {
  if (!rawUrl) {
    return undefined
  }

  const trimmed = rawUrl.trim().replace(/\/+$/, '')
  if (!trimmed) {
    return undefined
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function getCognitoDomain(): string {
  return sanitizeUrl(process.env.COGNITO_DOMAIN ?? process.env.NEXT_PUBLIC_COGNITO_DOMAIN) ?? DEFAULT_COGNITO_DOMAIN
}

export function getCognitoClientId(): string | undefined {
  return process.env.COGNITO_CLIENT_ID ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
}

export function getCognitoClientSecret(): string | undefined {
  return process.env.COGNITO_CLIENT_SECRET ?? process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET
}

export function getCognitoScope(): string {
  return (process.env.COGNITO_SCOPE ?? process.env.NEXT_PUBLIC_COGNITO_SCOPE ?? DEFAULT_SCOPE).trim()
}

export function getRedirectUri(origin: string): string {
  return sanitizeUrl(process.env.COGNITO_REDIRECT_URI ?? process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI)
    ?? `${origin.replace(/\/+$/, '')}${CALLBACK_PATH}`
}

export function getLogoutRedirectUri(origin: string): string {
  return sanitizeUrl(process.env.COGNITO_LOGOUT_URI ?? process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI)
    ?? `${origin.replace(/\/+$/, '')}${DEFAULT_LOGOUT_REDIRECT_PATH}`
}

export function generateRandomBase64Url(size = 32): string {
  return randomBytes(size).toString('base64url')
}

export function createCodeChallenge(codeVerifier: string): string {
  return createHash('sha256').update(codeVerifier).digest('base64url')
}

export function buildAuthorizeUrl(params: {
  cognitoDomain: string
  clientId: string
  redirectUri: string
  scope: string
  state: string
  codeChallenge: string
}) {
  const searchParams = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope: params.scope,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${params.cognitoDomain}/oauth2/authorize?${searchParams.toString()}`
}

export function buildLogoutUrl(params: {
  cognitoDomain: string
  clientId: string
  logoutUri: string
}) {
  const searchParams = new URLSearchParams({
    client_id: params.clientId,
    logout_uri: params.logoutUri,
  })

  return `${params.cognitoDomain}/logout?${searchParams.toString()}`
}

export function buildTokenRequestBody(params: {
  clientId: string
  code: string
  redirectUri: string
  codeVerifier: string
}) {
  return new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  })
}

export function buildRefreshTokenRequestBody(params: {
  clientId: string
  refreshToken: string
}) {
  return new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: params.clientId,
    refresh_token: params.refreshToken,
  })
}

export function buildCognitoTokenHeaders(params: {
  clientId: string
  clientSecret?: string
}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (!params.clientSecret) {
    return headers
  }

  const basicAuthValue = Buffer.from(`${params.clientId}:${params.clientSecret}`, 'utf8').toString('base64')
  headers.Authorization = `Basic ${basicAuthValue}`

  return headers
}

export function getCookieBaseOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure,
  }
}

export function clearCookies(
  response: { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } },
  secure: boolean,
  cookieNames: string[],
) {
  const baseOptions = getCookieBaseOptions(secure)

  for (const cookieName of cookieNames) {
    response.cookies?.set(cookieName, '', { ...baseOptions, maxAge: 0 })
  }
}

export function clearAuthFlowCookies(
  response: { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } },
  secure: boolean,
) {
  clearCookies(response, secure, [AUTH_STATE_COOKIE, AUTH_CODE_VERIFIER_COOKIE])
}

export function clearSessionCookies(
  response: { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } },
  secure: boolean,
) {
  clearCookies(response, secure, [ACCESS_TOKEN_COOKIE, ID_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, TOKEN_EXPIRES_AT_COOKIE])
}

export function clearAllAuthCookies(
  response: { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } },
  secure: boolean,
) {
  clearCookies(response, secure, [
    ACCESS_TOKEN_COOKIE,
    ID_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    TOKEN_EXPIRES_AT_COOKIE,
    AUTH_STATE_COOKIE,
    AUTH_CODE_VERIFIER_COOKIE,
  ])
}

export function setSessionCookies(
  response: { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } },
  secure: boolean,
  tokens: CognitoTokenSuccessResponse,
) {
  const expiresIn = Number(tokens.expires_in ?? 0)
  const expiresAt = expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : ''
  const baseOptions = getCookieBaseOptions(secure)

  if (tokens.access_token) {
    response.cookies?.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
      ...baseOptions,
      maxAge: expiresIn > 0 ? expiresIn : undefined,
    })
  }

  if (tokens.id_token) {
    response.cookies?.set(ID_TOKEN_COOKIE, tokens.id_token, {
      ...baseOptions,
      maxAge: expiresIn > 0 ? expiresIn : undefined,
    })
  }

  if (tokens.refresh_token) {
    response.cookies?.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, baseOptions)
  }

  if (expiresAt) {
    response.cookies?.set(TOKEN_EXPIRES_AT_COOKIE, expiresAt, {
      ...baseOptions,
      maxAge: expiresIn,
    })
  }

  return expiresAt
}

function decodeBase64Url(value: string): string | null {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))

  try {
    return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8')
  } catch {
    return null
  }
}

export function readJwtPayload(token?: string | null): Record<string, unknown> | null {
  if (!token) {
    return null
  }

  const parts = token.split('.')
  if (parts.length < 2) {
    return null
  }

  const decoded = decodeBase64Url(parts[1])
  if (!decoded) {
    return null
  }

  try {
    const payload = JSON.parse(decoded)
    return typeof payload === 'object' && payload !== null ? payload : null
  } catch {
    return null
  }
}

export function getUserFromIdToken(token?: string | null): JwtUser | null {
  const payload = readJwtPayload(token)
  if (!payload) {
    return null
  }

  const user: JwtUser = {}

  if (typeof payload.sub === 'string') {
    user.sub = payload.sub
  }

  if (typeof payload.email === 'string') {
    user.email = payload.email
  }

  if (typeof payload.name === 'string') {
    user.name = payload.name
  }

  return Object.keys(user).length > 0 ? user : null
}

export function isTokenExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) {
    return true
  }

  const expiresAtTime = Date.parse(expiresAt)
  if (Number.isNaN(expiresAtTime)) {
    return true
  }

  return expiresAtTime <= Date.now()
}

export function getSessionState(params: {
  accessToken?: string | null
  idToken?: string | null
  expiresAt?: string | null
}): SessionState {
  if (!params.accessToken || !params.idToken || isTokenExpired(params.expiresAt)) {
    return {
      authenticated: false,
      expiresAt: params.expiresAt ?? null,
      user: null,
    }
  }

  return {
    authenticated: true,
    expiresAt: params.expiresAt ?? null,
    user: getUserFromIdToken(params.idToken),
  }
}
