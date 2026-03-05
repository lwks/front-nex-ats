export type CognitoConfig = {
  domain?: string
  clientId?: string
  redirectUri?: string
  logoutUri?: string
  responseType?: string
  scope?: string
}

export type CognitoTokens = {
  accessToken: string
  idToken: string
  expiresAt: number
  tokenType?: string
}

export type AuthProfile = {
  sub?: string
  username?: string
  email?: string
  availableProfiles: string[]
}

const DEFAULT_RESPONSE_TYPE = 'token'
const DEFAULT_SCOPE = 'openid email profile'
const TOKEN_STORAGE_KEY = 'nexjob.auth.tokens'

function ensureHttpsDomain(rawDomain: string) {
  const trimmed = rawDomain.trim().replace(/\/+$/, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

function normalizeScope(scope?: string) {
  if (!scope) {
    return DEFAULT_SCOPE
  }

  return scope
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(' ')
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  if (typeof atob === 'function') {
    return atob(padded)
  }

  return Buffer.from(padded, 'base64').toString('utf-8')
}

export function parseJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) {
    return null
  }

  const [, payload] = token.split('.')
  if (!payload) {
    return null
  }

  try {
    return JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isTokenExpired(token?: string, nowMs = Date.now()) {
  const payload = parseJwtPayload(token)
  const exp = payload?.exp

  if (typeof exp !== 'number') {
    return true
  }

  return exp * 1000 <= nowMs
}

export function extractAuthProfile(idToken?: string): AuthProfile {
  const payload = parseJwtPayload(idToken) ?? {}
  const groups = payload['cognito:groups']

  const availableProfiles = Array.isArray(groups)
    ? groups.filter((group): group is string => typeof group === 'string')
    : []

  return {
    sub: typeof payload.sub === 'string' ? payload.sub : undefined,
    username:
      typeof payload['cognito:username'] === 'string'
        ? payload['cognito:username']
        : typeof payload.preferred_username === 'string'
          ? payload.preferred_username
          : undefined,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    availableProfiles,
  }
}

export function buildAuthorizeUrl(config: CognitoConfig, state: string) {
  if (!config.domain || !config.clientId || !config.redirectUri) {
    throw new Error('Configuração do Cognito incompleta para login.')
  }

  const domain = ensureHttpsDomain(config.domain)
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: config.responseType ?? DEFAULT_RESPONSE_TYPE,
    scope: normalizeScope(config.scope),
    redirect_uri: config.redirectUri,
    state,
  })

  return `${domain}/oauth2/authorize?${params.toString()}`
}

export function buildLogoutUrl(config: CognitoConfig) {
  if (!config.domain || !config.clientId || !config.logoutUri) {
    return null
  }

  const domain = ensureHttpsDomain(config.domain)
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.logoutUri,
  })

  return `${domain}/logout?${params.toString()}`
}

export function getCognitoConfig(): CognitoConfig {
  if (typeof window === 'undefined') {
    return {
      domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI,
      logoutUri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI,
      responseType: process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE,
      scope: process.env.NEXT_PUBLIC_COGNITO_SCOPE,
    }
  }

  const origin = window.location.origin
  return {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? `${origin}/auth/callback`,
    logoutUri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ?? origin,
    responseType: process.env.NEXT_PUBLIC_COGNITO_RESPONSE_TYPE,
    scope: process.env.NEXT_PUBLIC_COGNITO_SCOPE,
  }
}

export function createState() {
  return crypto.randomUUID()
}

export function parseTokensFromHash(hash: string): CognitoTokens | null {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(normalizedHash)
  const accessToken = params.get('access_token')
  const idToken = params.get('id_token')
  const expiresIn = Number.parseInt(params.get('expires_in') ?? '', 10)

  if (!accessToken || !idToken || Number.isNaN(expiresIn)) {
    return null
  }

  return {
    accessToken,
    idToken,
    tokenType: params.get('token_type') ?? undefined,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

export function persistTokens(tokens: CognitoTokens) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

export function loadTokens(): CognitoTokens | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as CognitoTokens
    if (!parsed.accessToken || !parsed.idToken || !parsed.expiresAt) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export function clearTokens() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function hasValidSession(tokens: CognitoTokens | null, nowMs = Date.now()) {
  if (!tokens) {
    return false
  }

  return tokens.expiresAt > nowMs && !isTokenExpired(tokens.idToken, nowMs)
}
