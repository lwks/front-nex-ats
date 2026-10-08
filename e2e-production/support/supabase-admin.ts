import { randomUUID } from "node:crypto"

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"

import { hasProductionAdminCredentials, updateRunState, type TemporaryUserRecord } from "./runtime"

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
  return `${label.toLowerCase()}-${process.env.PRODUCTION_E2E_RUN_ID?.toLowerCase()}@example.com`
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
    user_metadata: { full_name: `${accountType} ${process.env.PRODUCTION_E2E_RUN_ID}`, account_type: accountType },
  })
  if (error || !data.user) throw new Error(`Não foi possível preparar a conta ${accountType}: ${error?.message || "usuário ausente"}`)
  rememberUser({ email, purpose: label, removed: false })
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

export function rememberSignupEmail(email: string, purpose: "signup-candidate" | "signup-company") {
  rememberUser({ email, purpose, removed: false })
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
