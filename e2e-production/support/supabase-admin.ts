import { randomUUID } from "node:crypto"

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"

import { hasProductionAdminCredentials, productionAtsApiBaseUrl, updateRunState, type ExternalRecord, type TemporaryUserRecord } from "./runtime"

export type PreparedAccount = {
  id: string
  email: string
  password: string
  accountType: "CANDIDATE" | "COMPANY"
}

function adminClient(): SupabaseClient {
  const url = process.env.PRODUCTION_E2E_SUPABASE_URL?.trim()
  const serviceKey = process.env.PRODUCTION_E2E_SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) throw new Error("Credenciais administrativas do Supabase de produção não configuradas.")
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

function rememberUser(record: TemporaryUserRecord) {
  updateRunState((state) => {
    const existing = state.temporaryUsers.find((user) => user.email === record.email)
    if (existing) Object.assign(existing, record)
    else state.temporaryUsers.push(record)
  })
}

export function uniqueE2eEmail(label: string) {
  return `${process.env.PRODUCTION_E2E_RUN_ID?.toLowerCase()}-${label.toLowerCase()}@clusterjobs.test`
}

export async function createPreparedAccount(
  accountType: PreparedAccount["accountType"],
): Promise<PreparedAccount> {
  const client = adminClient()
  const label = accountType === "CANDIDATE" ? "authenticated-candidate" : "authenticated-company"
  const email = uniqueE2eEmail(label)
  const password = `E2e!${randomUUID()}Aa9`
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `${process.env.PRODUCTION_E2E_RUN_ID} ${accountType}`, account_type: accountType },
  })
  if (error || !data.user) throw new Error(`Não foi possível preparar a conta ${accountType}: ${error?.message || "usuário ausente"}`)
  rememberUser({ id: data.user.id, email, purpose: label, removed: false })
  return { id: data.user.id, email, password, accountType }
}

async function findUserByEmail(client: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 })
    if (error) throw error
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < 100) break
  }
  return null
}

export async function rememberSignupEmail(email: string, purpose: "signup-candidate" | "signup-company") {
  const user = await findUserByEmail(adminClient(), email)
  if (user) rememberUser({ id: user.id, email, purpose, removed: false })
  return user
}

export async function getAdminUser(userId: string) {
  const { data, error } = await adminClient().auth.admin.getUserById(userId)
  if (error || !data.user) throw new Error(`Não foi possível consultar o usuário temporário: ${error?.message || "usuário ausente"}`)
  return data.user
}

export async function cleanupRememberedUsers() {
  if (!hasProductionAdminCredentials()) return
  const client = adminClient()
  const snapshot = updateRunState(() => undefined)
  for (const userRecord of snapshot.temporaryUsers) {
    try {
      const user = await findUserByEmail(client, userRecord.email)
      if (user) {
        const { error } = await client.auth.admin.deleteUser(user.id)
        if (error) throw error
      }
      rememberUser({ ...userRecord, removed: true, cleanupError: undefined })
    } catch (error) {
      rememberUser({
        ...userRecord,
        removed: false,
        cleanupError: error instanceof Error ? error.message : "Falha desconhecida na limpeza.",
      })
    }
  }
}

export async function cleanupExternalRecords(company: PreparedAccount | null) {
  const state = updateRunState(() => undefined)
  const records = state.externalRecords.filter((record) => record.type === "candidate" || record.type === "job")
  if (!records.length) return

  const publishableKey = process.env.PRODUCTION_E2E_SUPABASE_PUBLISHABLE_KEY?.trim()
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!company || !publishableKey) {
    markRecordCleanup(records, "failed", "Conta de Empresa ou chave pública do Supabase ausente.")
    return
  }

  const client = createClient(process.env.PRODUCTION_E2E_SUPABASE_URL!.trim(), publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.signInWithPassword({ email: company.email, password: company.password })
  if (error || !data.session?.access_token) {
    markRecordCleanup(records, "failed", error?.message || "Não foi possível obter sessão de limpeza.")
    return
  }

  for (const type of ["candidate", "job"] as const) {
    if (type === "job" && records.some((record) => record.type === "candidate" && record.cleanupStatus !== "removed")) {
      markRecordCleanup(records.filter((record) => record.type === "job"), "failed", "Vaga preservada porque uma candidatura desta execução não teve remoção comprovada.")
      continue
    }
    for (const record of records.filter((item) => item.type === type)) {
      if (!record.id) {
        markRecordCleanup([record], "failed", "ID do registro não foi registrado.")
        continue
      }

      const resource = type === "candidate" ? "candidates" : "jobs"
      const url = `${productionAtsApiBaseUrl()}/${resource}/${encodeURIComponent(record.id)}`
      try {
        const deletion = await fetch(url, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        })
        if (!deletion.ok && deletion.status !== 404) throw new Error(`DELETE retornou HTTP ${deletion.status}`)

        const verification = await fetch(url, {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        })
        if (verification.status !== 404) throw new Error(`Verificação retornou HTTP ${verification.status}`)
        markRecordCleanup([record], "removed")
      } catch (error) {
        markRecordCleanup([record], "failed", error instanceof Error ? error.message : "Falha desconhecida.")
      }
    }
  }
}

function markRecordCleanup(records: ExternalRecord[], status: "removed" | "failed", error?: string) {
  updateRunState((state) => {
    for (const record of state.externalRecords) {
      if (!records.some((item) => item.type === record.type && item.id === record.id)) continue
      record.cleanupStatus = status
      record.cleanupError = error
    }
  })
}
