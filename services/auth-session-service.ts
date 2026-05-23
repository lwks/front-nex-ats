export type AuthSessionUser = {
  sub?: string
  email?: string
  name?: string
}

export type AuthSessionState = {
  authEnabled: boolean
  authenticated: boolean
  expiresAt: string | null
  user: AuthSessionUser | null
}

const ANONYMOUS_SESSION: AuthSessionState = {
  authEnabled: true,
  authenticated: false,
  expiresAt: null,
  user: null,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined
}

function normalizeUser(value: unknown): AuthSessionUser | null {
  if (!isRecord(value)) {
    return null
  }

  const sub = readString(value.sub)
  const email = readString(value.email)
  const name = readString(value.name)

  if (!sub && !email && !name) {
    return null
  }

  return { sub, email, name }
}

function normalizeSession(payload: unknown): AuthSessionState {
  if (!isRecord(payload)) {
    return ANONYMOUS_SESSION
  }

  const authEnabled = payload.authEnabled === false ? false : true

  if (payload.authenticated !== true) {
    return {
      ...ANONYMOUS_SESSION,
      authEnabled,
    }
  }

  return {
    authEnabled,
    authenticated: true,
    expiresAt: readString(payload.expiresAt) ?? null,
    user: normalizeUser(payload.user),
  }
}

export async function fetchAuthSession(): Promise<AuthSessionState> {
  try {
    const response = await fetch("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })

    if (!response.ok) {
      return ANONYMOUS_SESSION
    }

    const payload: unknown = await response.json()
    return normalizeSession(payload)
  } catch (error) {
    console.error("Erro ao consultar sessao atual:", error)
    return ANONYMOUS_SESSION
  }
}
