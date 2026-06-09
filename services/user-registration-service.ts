export type UserRegistrationRole = "candidate" | "recruiter" | "manager"

export type CreateFakeUserInput = {
  fullName: string
  email: string
  password: string
  role: UserRegistrationRole
  wantsJobAlerts: boolean
  acceptTerms: boolean
}

export type FakeUserAccount = {
  id: string
  fullName: string
  email: string
  role: UserRegistrationRole
  wantsJobAlerts: boolean
  status: "active"
  createdAt: string
}

type CreateFakeUserOptions = {
  shouldFail?: boolean
}

const ROLE_SET = new Set<UserRegistrationRole>(["candidate", "recruiter", "manager"])
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateFakeUserInput(input: CreateFakeUserInput) {
  if (input.fullName.trim().length < 3) {
    throw new Error("Informe um nome com pelo menos 3 caracteres.")
  }

  if (!EMAIL_PATTERN.test(input.email.trim())) {
    throw new Error("Informe um email valido.")
  }

  if (input.password.length < 8) {
    throw new Error("A senha precisa ter pelo menos 8 caracteres.")
  }

  if (!/[A-Za-z]/.test(input.password) || !/\d/.test(input.password)) {
    throw new Error("A senha precisa combinar letras e numeros.")
  }

  if (!ROLE_SET.has(input.role)) {
    throw new Error("Selecione um perfil de usuario valido.")
  }

  if (input.acceptTerms !== true) {
    throw new Error("Voce precisa aceitar os termos para criar o usuario.")
  }
}

function normalizeInput(input: CreateFakeUserInput): CreateFakeUserInput {
  return {
    ...input,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
  }
}

function generateFakeUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `fake-user-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function createFakeUserAccount(
  input: CreateFakeUserInput,
  options: CreateFakeUserOptions = {},
): Promise<FakeUserAccount> {
  const normalizedInput = normalizeInput(input)

  validateFakeUserInput(normalizedInput)

  if (options.shouldFail) {
    throw new Error("Nao foi possivel criar o usuario fake no momento.")
  }

  await Promise.resolve()

  return {
    id: generateFakeUserId(),
    fullName: normalizedInput.fullName,
    email: normalizedInput.email,
    role: normalizedInput.role,
    wantsJobAlerts: normalizedInput.wantsJobAlerts,
    status: "active",
    createdAt: new Date().toISOString(),
  }
}
