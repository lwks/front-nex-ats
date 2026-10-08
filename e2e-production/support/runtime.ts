import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

export type TemporaryUserRecord = {
  email: string
  purpose: "authenticated-candidate" | "authenticated-company" | "signup-candidate" | "signup-company"
  removed: boolean
  cleanupError?: string
}

export type ExternalRecord = {
  type: "job" | "candidate" | "note"
  identifier: string
}

export type ProductionRunState = {
  runId: string
  startedAt: string
  baseUrl: string
  authEnabled: boolean | null
  adminCredentialsAvailable: boolean
  deployEvidence: Record<string, string>
  temporaryUsers: TemporaryUserRecord[]
  externalRecords: ExternalRecord[]
}

const DEFAULT_BASE_URL = "https://dainty-sprinkles-4f0492.netlify.app"
const DEFAULT_ATS_API_BASE_URL = "https://qqkukhkx3ee4of2muxjlb7f3l40qeari.lambda-url.us-east-1.on.aws/api"

export function createRunIdentifier(now = new Date(), suffix = Math.random().toString(36).slice(2, 8)) {
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")
  return `E2E-${timestamp}-${suffix}`
}

function normalizedUrl(value: string) {
  return value.trim().replace(/\/+$/, "")
}

export function productionBaseUrl() {
  return normalizedUrl(process.env.PRODUCTION_E2E_BASE_URL || DEFAULT_BASE_URL)
}

export function productionAtsApiBaseUrl() {
  return normalizedUrl(process.env.PRODUCTION_E2E_ATS_API_BASE_URL || DEFAULT_ATS_API_BASE_URL)
}

export function productionRunId() {
  return process.env.PRODUCTION_E2E_RUN_ID || createRunIdentifier()
}

export function productionStatePath(runId = productionRunId()) {
  return resolve(process.cwd(), "test-results", "production", `run-state-${runId}.json`)
}

export function productionReportPath(runId = productionRunId()) {
  return resolve(process.cwd(), "production-e2e-reports", `${runId}.md`)
}

export function hasProductionAdminCredentials() {
  return Boolean(
    process.env.PRODUCTION_E2E_SUPABASE_URL?.trim() &&
      process.env.PRODUCTION_E2E_SUPABASE_SERVICE_ROLE_KEY?.trim(),
  )
}

export function initializeRunState(runId = productionRunId()) {
  const state: ProductionRunState = {
    runId,
    startedAt: new Date().toISOString(),
    baseUrl: productionBaseUrl(),
    authEnabled: null,
    adminCredentialsAvailable: hasProductionAdminCredentials(),
    deployEvidence: {},
    temporaryUsers: [],
    externalRecords: [],
  }
  writeRunState(state)
  return state
}

export function readRunState(runId = productionRunId()): ProductionRunState {
  try {
    return JSON.parse(readFileSync(productionStatePath(runId), "utf8")) as ProductionRunState
  } catch {
    return initializeRunState(runId)
  }
}

export function writeRunState(state: ProductionRunState) {
  const filePath = productionStatePath(state.runId)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

export function updateRunState(update: (state: ProductionRunState) => void) {
  const state = readRunState()
  update(state)
  writeRunState(state)
  return state
}
