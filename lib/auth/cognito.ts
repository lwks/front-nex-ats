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
  refreshToken?: string
  expiresAt: number
  tokenType?: string
}

export type AuthProfile = {
  sub?: string
  username?: string
  email?: string
  availableProfiles: string[]
}

type AuthTransaction = {
  state: string
  nonce: string
  codeVerifier: string
  createdAt: number
}

const DEFAULT_RESPONSE_TYPE = 'code'
const DEFAULT_SCOPE = 'openid email profile'
const TOKEN_STORAGE_KEY = 'nexjob.auth.tokens'
const AUTH_TRANSACTION_KEY = 'nexjob.auth.transaction'

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

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  const encoded = typeof btoa === 'function' ? btoa(binary) : Buffer.from(binary, 'binary').toString('base64')

  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createRandomString(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const randomValues = crypto.getRandomValues(new Uint8Array(length))
  let result = ''

  for (let i = 0; i < length; i += 1) {
    result += charset[randomValues[i] % charset.length]
  }

  return result
}

async function createCodeChallenge(codeVerifier: string) {
  const bytes = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return encodeBase64Url(new Uint8Array(digest))
}

function parseQueryParams(queryOrUrl: string) {
  const value = queryOrUrl.startsWith('?') ? queryOrUrl.slice(1) : queryOrUrl
  return new URLSearchParams(value)
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

export function buildAuthorizeUrl(config: CognitoConfig, params: Record<string, string>) {
  if (!config.domain || !config.clientId || !config.redirectUri) {
    throw new Error('Configuração do Cognito incompleta para login.')
  }

  const domain = ensureHttpsDomain(config.domain)
  const searchParams = new URLSearchParams({
    client_id: config.clientId,
    response_type: config.responseType ?? DEFAULT_RESPONSE_TYPE,
    scope: normalizeScope(config.scope),
    redirect_uri: config.redirectUri,
    ...params,
  })

  return `${domain}/oauth2/authorize?${searchParams.toString()}`
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

function saveAuthTransaction(transaction: AuthTransaction) {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.setItem(AUTH_TRANSACTION_KEY, JSON.stringify(transaction))
}

function loadAuthTransaction() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.sessionStorage.getItem(AUTH_TRANSACTION_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthTransaction
  } catch {
    return null
  }
}

function clearAuthTransaction() {
  if (typeof window === 'undefined') {
    return
  }

  window.sessionStorage.removeItem(AUTH_TRANSACTION_KEY)
}

export async function createAuthorizeRequest(config: CognitoConfig) {
  const state = createRandomString(32)
  const nonce = createRandomString(32)
  const codeVerifier = createRandomString(96)
  const codeChallenge = await createCodeChallenge(codeVerifier)

  saveAuthTransaction({
    state,
    nonce,
    codeVerifier,
    createdAt: Date.now(),
  })

  return buildAuthorizeUrl(config, {
    state,
    nonce,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  })
}

export function parseAuthCallbackParams(query: string) {
  const params = parseQueryParams(query)

  return {
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  }
}

export async function exchangeCodeForTokens(config: CognitoConfig, callbackQuery: string): Promise<CognitoTokens> {
  if (!config.domain || !config.clientId || !config.redirectUri) {
    throw new Error('Configuração do Cognito incompleta para troca de código.')
  }

  const callback = parseAuthCallbackParams(callbackQuery)

  if (callback.error) {
    throw new Error(callback.errorDescription ?? callback.error)
  }

  if (!callback.code || !callback.state) {
    throw new Error('Parâmetros inválidos no callback do Cognito.')
  }

  const transaction = loadAuthTransaction()
  clearAuthTransaction()

  if (!transaction || callback.state !== transaction.state) {
    throw new Error('Falha de segurança no login (state inválido).')
  }

  const domain = ensureHttpsDomain(config.domain)
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    code: callback.code,
    redirect_uri: config.redirectUri,
    code_verifier: transaction.codeVerifier,
  })

  const response = await fetch(`${domain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!response.ok) {
    throw new Error('Falha ao trocar código por token no Cognito.')
  }

  const data = (await response.json()) as {
    access_token?: string
    id_token?: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
  }

  if (!data.access_token || !data.id_token || typeof data.expires_in !== 'number') {
    throw new Error('Resposta inválida do endpoint de token do Cognito.')
  }

  const payload = parseJwtPayload(data.id_token)
  if (!payload || payload.nonce !== transaction.nonce) {
    throw new Error('Falha de segurança no login (nonce inválido).')
  }

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
    tokenType: data.token_type,
    expiresAt: Date.now() + data.expires_in * 1000,
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
