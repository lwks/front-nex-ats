import { createHash, randomBytes } from 'node:crypto'

const DEFAULT_COGNITO_DOMAIN = 'https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com'
const DEFAULT_SCOPE = 'openid email profile'
const CALLBACK_PATH = '/api/auth/callback'

export const AUTH_STATE_COOKIE = 'nexjob_auth_state'
export const AUTH_CODE_VERIFIER_COOKIE = 'nexjob_code_verifier'
export const ACCESS_TOKEN_COOKIE = 'nexjob_access_token'
export const ID_TOKEN_COOKIE = 'nexjob_id_token'
export const REFRESH_TOKEN_COOKIE = 'nexjob_refresh_token'
export const TOKEN_EXPIRES_AT_COOKIE = 'nexjob_token_expires_at'
export const AUTH_COOKIE_MAX_AGE_SECONDS = 10 * 60

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

export function getCognitoScope(): string {
  return (process.env.COGNITO_SCOPE ?? process.env.NEXT_PUBLIC_COGNITO_SCOPE ?? DEFAULT_SCOPE).trim()
}

export function getRedirectUri(origin: string): string {
  return sanitizeUrl(process.env.COGNITO_REDIRECT_URI ?? process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI)
    ?? `${origin.replace(/\/+$/, '')}${CALLBACK_PATH}`
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

export function getCookieBaseOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure,
  }
}

export function clearAuthFlowCookies(
  response: { cookies?: { set: (name: string, value: string, options?: Record<string, unknown>) => unknown } },
  secure: boolean,
) {
  const baseOptions = getCookieBaseOptions(secure)

  response.cookies?.set(AUTH_STATE_COOKIE, '', { ...baseOptions, maxAge: 0 })
  response.cookies?.set(AUTH_CODE_VERIFIER_COOKIE, '', { ...baseOptions, maxAge: 0 })
}
