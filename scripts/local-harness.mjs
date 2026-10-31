import { spawn, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

const front = fileURLToPath(new URL('..', import.meta.url))
const back = path.resolve(front, '..', 'lambda-api-next')
const mode = process.argv[2] || 'start'
const children = []
let stopping = false

function port(name, fallback) {
  const number = Number(process.env[name] || fallback)
  if (!Number.isInteger(number) || number < 1024 || number > 65535) throw new Error(`Invalid port: ${name}`)
  return number
}
const frontPort = port('HARNESS_FRONT_PORT', 3000)
const backPort = port('HARNESS_BACK_PORT', 3001)
const authPort = port('E2E_SUPABASE_PORT', 54329)
if (new Set([frontPort, backPort, authPort]).size !== 3) throw new Error('Harness ports must be different')
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  throw new Error('Local harness cannot run in hosted/production runtimes')
}

// Explicit process environment overrides any .env.local without changing it.
const env = {
  ...process.env, NODE_ENV: 'development', HARNESS_MODE: 'local',
  HARNESS_BACK_PORT: String(backPort), E2E_SUPABASE_PORT: String(authPort),
  NEXT_PUBLIC_API_BASE_URL: `http://localhost:${backPort}/api`,
  NEXT_PUBLIC_SUPABASE_URL: `http://localhost:${authPort}`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-public-key',
  SUPABASE_SERVICE_ROLE_KEY: 'e2e-server-key', NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED: 'false',
}

function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (child.exitCode !== null || child.signalCode !== null) continue
    if (process.platform === 'win32') {
      try { execFileSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }) } catch { /* already stopped */ }
    } else child.kill('SIGTERM')
  }
  const deadline = setTimeout(() => {
    for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
  }, 5000)
  deadline.unref()
  process.exitCode = code
}

function run(cwd, args) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' })
  children.push(child)
  child.once('error', error => { console.error(error.message); stop(1) })
  child.once('exit', code => { if (!stopping) { console.error(`Harness service exited (${code}): ${args.join(' ')}`); stop(1) } })
  return child
}

async function check(url, service) {
  const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
  const body = await response.json()
  if (!response.ok || body.service !== service) throw new Error(`Unexpected service at ${url}`)
}

const checks = [
  [`http://localhost:${authPort}/health`, 'ats-local-auth'],
  [`http://localhost:${backPort}/__local/health`, 'ats-local-api'],
  [`http://localhost:${frontPort}/api/local/health`, 'ats-local-front'],
]

async function waitFor([url, service]) {
  const deadline = Date.now() + 120000
  while (Date.now() < deadline && !stopping) {
    try { await check(url, service); return } catch { await delay(400) }
  }
  throw new Error(`Service did not become ready: ${url}`)
}

async function requireFreePorts() {
  for (const number of [frontPort, backPort, authPort]) {
    await new Promise((resolve, reject) => {
      const server = net.createServer()
      server.once('error', () => reject(new Error(`Port ${number} is occupied. Stop the existing service; the harness never reuses unknown servers.`)))
      server.listen(number, '127.0.0.1', () => server.close(resolve))
    })
  }
}

async function main() {
  if (mode === 'doctor') {
    for (const [url, service] of checks) {
      await check(url, service)
      console.log(`OK ${service}: ${url}`)
    }
    return
  }
  if (!['start', 'reset'].includes(mode)) throw new Error('Usage: local-harness.mjs [start|doctor|reset]')
  for (const file of [path.join(front, 'node_modules/next/dist/bin/next'), path.join(back, 'node_modules/express/package.json'), path.join(back, 'scripts/local-harness.cjs')]) {
    if (!existsSync(file)) throw new Error(`Missing ${file}. Install dependencies in both sibling repositories and use feature/config-harness.`)
  }
  await requireFreePorts()
  if (mode === 'reset') {
    execFileSync(process.execPath, ['scripts/local-harness.cjs', '--reset'], { cwd: back, env, stdio: 'inherit' })
    return
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(0))
  run(front, ['e2e/mock-supabase.mjs'])
  await waitFor(checks[0])
  run(back, ['scripts/local-harness.cjs'])
  await waitFor(checks[1])
  run(front, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(frontPort)])
  await waitFor(checks[2])
  console.log(`\nHarness ready: http://localhost:${frontPort}\nUse the yellow bar to select company/candidate. Ctrl+C stops all services.\n`)
}

main().catch(error => { console.error(error.message); stop(1) })
