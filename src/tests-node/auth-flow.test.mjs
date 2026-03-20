import test from 'node:test'
import assert from 'node:assert/strict'

import { NextRequest } from 'next/server.js'

import { GET as loginRoute } from '../../app/api/auth/login/route.ts'
import { GET as callbackRoute } from '../../app/api/auth/callback/route.ts'
import {
  ACCESS_TOKEN_COOKIE,
  AUTH_CODE_VERIFIER_COOKIE,
  AUTH_STATE_COOKIE,
  ID_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
  buildAuthorizeUrl,
  buildTokenRequestBody,
  createCodeChallenge,
  getCognitoDomain,
  getCognitoScope,
  getRedirectUri,
} from '../../lib/auth/cognito.ts'

const originalEnv = { ...process.env }

function restoreEnv() {
  process.env = { ...originalEnv }
  delete global.fetch
}

test.beforeEach(() => {
  restoreEnv()
  process.env.COGNITO_CLIENT_ID = 'client-123'
})

test.after(() => {
  restoreEnv()
})

test('auth helpers build authorize url and token payload correctly', () => {
  const authorizeUrl = new URL(
    buildAuthorizeUrl({
      cognitoDomain: 'https://domain.auth.us-east-1.amazoncognito.com',
      clientId: 'client-123',
      redirectUri: 'http://localhost:3000/api/auth/callback',
      scope: 'openid email profile',
      state: 'state-1',
      codeChallenge: 'challenge-1',
    }),
  )

  assert.equal(authorizeUrl.pathname, '/oauth2/authorize')
  assert.equal(authorizeUrl.searchParams.get('response_type'), 'code')
  assert.equal(authorizeUrl.searchParams.get('client_id'), 'client-123')
  assert.equal(authorizeUrl.searchParams.get('redirect_uri'), 'http://localhost:3000/api/auth/callback')
  assert.equal(authorizeUrl.searchParams.get('scope'), 'openid email profile')
  assert.equal(authorizeUrl.searchParams.get('state'), 'state-1')
  assert.equal(authorizeUrl.searchParams.get('code_challenge'), 'challenge-1')
  assert.equal(authorizeUrl.searchParams.get('code_challenge_method'), 'S256')

  const tokenBody = buildTokenRequestBody({
    clientId: 'client-123',
    code: 'code-123',
    redirectUri: 'http://localhost:3000/api/auth/callback',
    codeVerifier: 'verifier-123',
  })

  assert.equal(tokenBody.get('grant_type'), 'authorization_code')
  assert.equal(tokenBody.get('client_id'), 'client-123')
  assert.equal(tokenBody.get('code'), 'code-123')
  assert.equal(tokenBody.get('redirect_uri'), 'http://localhost:3000/api/auth/callback')
  assert.equal(tokenBody.get('code_verifier'), 'verifier-123')
  assert.equal(createCodeChallenge('verifier-123'), 'Ds3NpaREu9I2EYq6l0l3ZkFyv_Gt5O4EpGD6cZlY0Kg')
})

test('auth helpers read configured values and fallback defaults', () => {
  process.env.COGNITO_DOMAIN = 'custom-domain.auth.us-east-1.amazoncognito.com/'
  process.env.COGNITO_SCOPE = 'openid aws.cognito.signin.user.admin'
  process.env.COGNITO_REDIRECT_URI = 'https://app.company.com/auth/callback/'

  assert.equal(getCognitoDomain(), 'https://custom-domain.auth.us-east-1.amazoncognito.com')
  assert.equal(getCognitoScope(), 'openid aws.cognito.signin.user.admin')
  assert.equal(getRedirectUri('http://localhost:3000'), 'https://app.company.com/auth/callback')

  delete process.env.COGNITO_DOMAIN
  delete process.env.COGNITO_SCOPE
  delete process.env.COGNITO_REDIRECT_URI

  assert.equal(getCognitoDomain(), 'https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com')
  assert.equal(getCognitoScope(), 'openid email profile')
  assert.equal(getRedirectUri('http://localhost:3000'), 'http://localhost:3000/api/auth/callback')
})



test('auth helpers ignore blank configured urls', () => {
  process.env.COGNITO_DOMAIN = '   '
  process.env.COGNITO_REDIRECT_URI = '   '

  assert.equal(getCognitoDomain(), 'https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com')
  assert.equal(getRedirectUri('http://localhost:3000/'), 'http://localhost:3000/api/auth/callback')
})

test('login route redirects to cognito authorize and stores short-lived auth cookies', async () => {
  const response = await loginRoute(new NextRequest('http://localhost:3000/api/auth/login'))

  assert.equal(response.status, 307)

  const location = response.headers.get('location')
  assert.ok(location)

  const redirectUrl = new URL(location)
  assert.equal(
    `${redirectUrl.origin}${redirectUrl.pathname}`,
    'https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com/oauth2/authorize',
  )
  assert.equal(redirectUrl.searchParams.get('response_type'), 'code')
  assert.equal(redirectUrl.searchParams.get('client_id'), 'client-123')
  assert.equal(redirectUrl.searchParams.get('redirect_uri'), 'http://localhost:3000/api/auth/callback')
  assert.equal(redirectUrl.searchParams.get('scope'), 'openid email profile')
  assert.equal(redirectUrl.searchParams.get('code_challenge_method'), 'S256')
  assert.ok(redirectUrl.searchParams.get('state'))
  assert.ok(redirectUrl.searchParams.get('code_challenge'))
  assert.equal(response.cookies.get(AUTH_STATE_COOKIE)?.value, redirectUrl.searchParams.get('state'))
  assert.ok(response.cookies.get(AUTH_CODE_VERIFIER_COOKIE)?.value)
})

test('login route returns 500 when client id is missing', async () => {
  delete process.env.COGNITO_CLIENT_ID
  delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

  const response = await loginRoute(new NextRequest('http://localhost:3000/api/auth/login'))
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { message: 'COGNITO_CLIENT_ID não configurado.' })
})

test('callback route rejects requests missing required callback params', async () => {
  const response = await callbackRoute(new NextRequest('http://localhost:3000/api/auth/callback'))

  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { message: 'Parâmetros code e state são obrigatórios no callback.' })
})

test('callback route rejects mismatched state values', async () => {
  const request = new NextRequest('http://localhost:3000/api/auth/callback?code=abc&state=returned-state', {
    headers: {
      cookie: `${AUTH_STATE_COOKIE}=saved-state; ${AUTH_CODE_VERIFIER_COOKIE}=verifier-123`,
    },
  })

  const response = await callbackRoute(request)
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { message: 'State inválido ou expirado.' })
})



test('callback route rejects missing code verifier cookies', async () => {
  const request = new NextRequest('http://localhost:3000/api/auth/callback?code=abc&state=saved-state', {
    headers: {
      cookie: `${AUTH_STATE_COOKIE}=saved-state`,
    },
  })

  const response = await callbackRoute(request)
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { message: 'Code verifier ausente ou expirado.' })
})

test('callback route returns 500 when client id is missing during token exchange', async () => {
  delete process.env.COGNITO_CLIENT_ID
  delete process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

  const request = new NextRequest('http://localhost:3000/api/auth/callback?code=abc&state=saved-state', {
    headers: {
      cookie: `${AUTH_STATE_COOKIE}=saved-state; ${AUTH_CODE_VERIFIER_COOKIE}=verifier-123`,
    },
  })

  const response = await callbackRoute(request)
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), { message: 'COGNITO_CLIENT_ID não configurado.' })
})

test('callback route posts code exchange to /oauth2/token and stores returned tokens', async () => {
  const fetchCalls = []
  global.fetch = async (url, init) => {
    fetchCalls.push([url, init])
    return {
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'access-123',
        id_token: 'id-123',
        refresh_token: 'refresh-123',
        expires_in: 3600,
        token_type: 'Bearer',
      }),
    }
  }

  const request = new NextRequest('http://localhost:3000/api/auth/callback?code=abc123&state=saved-state', {
    headers: {
      cookie: `${AUTH_STATE_COOKIE}=saved-state; ${AUTH_CODE_VERIFIER_COOKIE}=verifier-123`,
    },
  })

  const response = await callbackRoute(request)

  assert.equal(fetchCalls.length, 1)
  assert.equal(fetchCalls[0][0], 'https://us-east-1sa8vsmupy.auth.us-east-1.amazoncognito.com/oauth2/token')
  assert.equal(fetchCalls[0][1].method, 'POST')
  assert.equal(fetchCalls[0][1].cache, 'no-store')
  assert.deepEqual(fetchCalls[0][1].headers, {
    'Content-Type': 'application/x-www-form-urlencoded',
  })
  assert.equal(
    fetchCalls[0][1].body,
    'grant_type=authorization_code&client_id=client-123&code=abc123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fcallback&code_verifier=verifier-123',
  )

  assert.equal(response.status, 307)
  assert.equal(response.headers.get('location'), 'http://localhost:3000/')
  assert.equal(response.cookies.get(ACCESS_TOKEN_COOKIE)?.value, 'access-123')
  assert.equal(response.cookies.get(ID_TOKEN_COOKIE)?.value, 'id-123')
  assert.equal(response.cookies.get(REFRESH_TOKEN_COOKIE)?.value, 'refresh-123')
  assert.ok(response.cookies.get(TOKEN_EXPIRES_AT_COOKIE)?.value)
  assert.equal(response.cookies.get(AUTH_STATE_COOKIE)?.value, '')
  assert.equal(response.cookies.get(AUTH_CODE_VERIFIER_COOKIE)?.value, '')
})

test('callback route returns upstream token errors and clears auth flow cookies', async () => {
  global.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'invalid_grant' }),
  })

  const request = new NextRequest('http://localhost:3000/api/auth/callback?code=abc123&state=saved-state', {
    headers: {
      cookie: `${AUTH_STATE_COOKIE}=saved-state; ${AUTH_CODE_VERIFIER_COOKIE}=verifier-123`,
    },
  })

  const response = await callbackRoute(request)

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), {
    message: 'Falha ao obter tokens do Cognito.',
    details: { error: 'invalid_grant' },
  })
})

test('callback route returns 502 when cognito token exchange crashes', async () => {
  const originalError = console.error
  const consoleErrors = []
  console.error = (...args) => {
    consoleErrors.push(args)
  }
  global.fetch = async () => {
    throw new Error('network')
  }

  const request = new NextRequest('http://localhost:3000/api/auth/callback?code=abc123&state=saved-state', {
    headers: {
      cookie: `${AUTH_STATE_COOKIE}=saved-state; ${AUTH_CODE_VERIFIER_COOKIE}=verifier-123`,
    },
  })

  const response = await callbackRoute(request)
  console.error = originalError

  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { message: 'Falha ao comunicar com o Cognito.' })
  assert.equal(consoleErrors.length, 1)
})
