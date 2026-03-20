import { createHash, randomBytes } from "node:crypto"

import {
  COGNITO_AUTHORIZE_URL,
  COGNITO_CLIENT_ID,
  COGNITO_CLIENT_SECRET,
  COGNITO_REDIRECT_URI,
  COGNITO_SCOPES,
  COGNITO_TOKEN_URL,
} from "@/config"

export interface CognitoTokenResponse {
  access_token: string
  expires_in: number
  id_token?: string
  refresh_token?: string
  scope?: string
  token_type: string
}

export interface CognitoTokenErrorResponse {
  error: string
  error_description?: string
}

function toBase64Url(buffer: Buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function assertAuthConfig() {
  if (!COGNITO_CLIENT_ID || !COGNITO_REDIRECT_URI || !COGNITO_TOKEN_URL || !COGNITO_AUTHORIZE_URL) {
    throw new Error(
      "Cognito is not fully configured. Set COGNITO_DOMAIN, COGNITO_CLIENT_ID and COGNITO_REDIRECT_URI.",
    )
  }
}

async function parseTokenResponse(response: Response): Promise<CognitoTokenResponse> {
  const payload = (await response.json()) as CognitoTokenResponse | CognitoTokenErrorResponse

  if (!response.ok) {
    const errorPayload = payload as CognitoTokenErrorResponse
    const description = errorPayload.error_description ?? errorPayload.error
    throw new Error(`Cognito token exchange failed (${response.status}): ${description}`)
  }

  return payload as CognitoTokenResponse
}

export function generateCodeVerifier(length = 64): string {
  const byteLength = Math.ceil((length * 3) / 4)
  return toBase64Url(randomBytes(byteLength)).slice(0, length)
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  return toBase64Url(createHash("sha256").update(codeVerifier).digest())
}

export async function buildAuthorizeUrl({
  codeChallenge,
  state,
}: {
  codeChallenge: string
  state: string
}): Promise<string> {
  assertAuthConfig()

  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID!,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    redirect_uri: COGNITO_REDIRECT_URI!,
    response_type: "code",
    scope: COGNITO_SCOPES,
    state,
  })

  return `${COGNITO_AUTHORIZE_URL}?${params.toString()}`
}

function buildTokenRequestBody(params: Record<string, string>) {
  const body = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID!,
    redirect_uri: COGNITO_REDIRECT_URI!,
    ...params,
  })

  if (COGNITO_CLIENT_SECRET) {
    body.set("client_secret", COGNITO_CLIENT_SECRET)
  }

  return body
}

export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<CognitoTokenResponse> {
  assertAuthConfig()

  const response = await fetch(COGNITO_TOKEN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildTokenRequestBody({
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
    }),
  })

  return parseTokenResponse(response)
}

export async function refreshToken(refreshTokenValue: string): Promise<CognitoTokenResponse> {
  assertAuthConfig()

  const response = await fetch(COGNITO_TOKEN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: buildTokenRequestBody({
      grant_type: "refresh_token",
      refresh_token: refreshTokenValue,
    }),
  })

  return parseTokenResponse(response)
}
