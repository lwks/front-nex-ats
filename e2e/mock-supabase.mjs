import { createHmac } from 'node:crypto'
import { createServer } from 'node:http'

const roles = new Map()
const port = 54329

function tokenFor(id) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const role = roles.get(id)
  const payload = Buffer.from(JSON.stringify({
    iss: `http://localhost:${port}/auth/v1`, aud: 'authenticated', role: 'authenticated',
    sub: id, email: `${id}@example.com`, exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000), app_metadata: role ? { account_type: role } : {},
    user_metadata: {},
  })).toString('base64url')
  const signature = createHmac('sha256', 'e2e-only-secret').update(`${header}.${payload}`).digest('base64url')
  return `${header}.${payload}.${signature}`
}

function userFor(id) {
  return { id, email: `${id}@example.com`, app_metadata: roles.has(id) ? { account_type: roles.get(id) } : {}, user_metadata: {}, aud: 'authenticated' }
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Private-Network': 'true', 'Access-Control-Allow-Headers': 'apikey, authorization, content-type, x-client-info, x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', ...headers })
  response.end(JSON.stringify(body))
}

async function bodyOf(request) {
  const chunks = []
  for await (const chunk of request) chunks.push(chunk)
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) } catch { return {} }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`)
  if (request.method === 'OPTIONS') return send(response, 204, {})
  if (url.pathname === '/health') return send(response, 200, { ok: true })
  if (url.pathname === '/auth/v1/.well-known/jwks.json') return send(response, 200, { keys: [] })

  if (url.pathname === '/auth/v1/authorize') {
    const redirect = url.searchParams.get('redirect_to') ?? 'http://localhost:3000/auth/callback'
    response.writeHead(302, { Location: `${redirect}${redirect.includes('?') ? '&' : '?'}code=mock-oauth-code` })
    return response.end()
  }

  if (url.pathname === '/auth/v1/token' && request.method === 'POST') {
    const body = await bodyOf(request)
    const grant = url.searchParams.get('grant_type')
    let id = 'd7495e8c-62cf-46aa-af31-a3aa44b092d0'
    if (grant === 'password') {
      if (body.password !== 'correct-password') return send(response, 400, { message: 'Invalid login credentials' })
      id = String(body.email).split('@')[0]
      if (id === 'candidate') roles.set(id, 'CANDIDATE')
      if (id === 'company') roles.set(id, 'COMPANY')
    } else if (grant === 'refresh_token') {
      id = String(body.refresh_token).replace(/^refresh-/, '')
    }
    const accessToken = tokenFor(id)
    return send(response, 200, { access_token: accessToken, refresh_token: `refresh-${id}`, token_type: 'bearer', expires_in: 3600, user: userFor(id) })
  }

  if (url.pathname === '/auth/v1/user' && request.method === 'GET') {
    const token = request.headers.authorization?.replace(/^Bearer /i, '')
    try {
      const id = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub
      return send(response, 200, userFor(id))
    } catch { return send(response, 401, { message: 'Invalid token' }) }
  }

  if (url.pathname === '/auth/v1/user' && request.method === 'PUT') {
    const token = request.headers.authorization?.replace(/^Bearer /i, '')
    try {
      const id = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub
      return send(response, 200, userFor(id))
    } catch { return send(response, 401, { message: 'Invalid token' }) }
  }

  if (url.pathname === '/auth/v1/signup' && request.method === 'POST') {
    const body = await bodyOf(request)
    return send(response, 200, { user: { ...userFor(String(body.email).split('@')[0]), user_metadata: body.data ?? {} }, session: null })
  }

  if (url.pathname === '/auth/v1/recover') return send(response, 200, {})

  if (url.pathname === '/auth/v1/verify' && request.method === 'POST') {
    const body = await bodyOf(request)
    const id = body.type === 'recovery' ? 'candidate' : '7dd85123-6110-4cfb-a268-41f20284cba1'
    return send(response, 200, {
      access_token: tokenFor(id), refresh_token: `refresh-${id}`, token_type: 'bearer', expires_in: 3600,
      user: userFor(id),
    })
  }

  if (url.pathname.startsWith('/auth/v1/admin/users/')) {
    const id = url.pathname.split('/').at(-1)
    if (request.method === 'GET') return send(response, 200, userFor(id))
    if (request.method === 'PUT') {
      const body = await bodyOf(request)
      if (body.app_metadata?.account_type) roles.set(id, body.app_metadata.account_type)
      return send(response, 200, userFor(id))
    }
  }

  send(response, 404, { message: `Unmocked ${request.method} ${url.pathname}` })
}).listen(port)
