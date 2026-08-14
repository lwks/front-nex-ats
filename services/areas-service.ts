import { apiFetch } from "@/services/api-client"

export type AreaApiRecord = {
  ID: number
  DS_AREA: string
}

export type AreaOption = {
  value: string
  label: string
}

export type AreaOptionsLoadResult = {
  options: AreaOption[]
  source: "api" | "fallback"
  error?: string
}

export const fallbackAreaOptions: AreaOption[] = [
  { value: "1", label: "Finanças" },
  { value: "2", label: "Recursos Humanos" },
  { value: "3", label: "Tecnologia da Informação" },
  { value: "4", label: "Dados" },
  { value: "5", label: "Comercial e Vendas" },
  { value: "6", label: "Marketing" },
  { value: "7", label: "Operações" },
  { value: "8", label: "Supply Chain" },
  { value: "9", label: "Jurídico e Compliance" },
  { value: "10", label: "Riscos e Auditoria" },
  { value: "11", label: "Customer Success" },
  { value: "12", label: "Produtos" },
  { value: "13", label: "Administração e Facilities" },
]

function normalizeAreaRecord(area: AreaApiRecord): AreaOption {
  if (!Number.isFinite(area.ID) || !Number.isInteger(area.ID) || area.ID <= 0) {
    throw new Error("Registro de área inválido")
  }

  if (!String(area.DS_AREA ?? "").trim()) {
    throw new Error("Registro de área inválido")
  }

  return {
    value: String(area.ID),
    label: area.DS_AREA,
  }
}

export function normalizeAreaResponse(payload: unknown): AreaOption[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) {
    throw new Error("Resposta inválida para /api/areas")
  }

  return (payload as { data: AreaApiRecord[] }).data.map(normalizeAreaRecord)
}

export async function fetchAreaOptions(): Promise<AreaOption[]> {
  const payload = await apiFetch<{ data?: AreaApiRecord[] }>("/areas")
  return normalizeAreaResponse(payload)
}

export async function loadAreaOptions(): Promise<AreaOptionsLoadResult> {
  try {
    return { options: await fetchAreaOptions(), source: "api" }
  } catch (error) {
    return {
      options: fallbackAreaOptions,
      source: "fallback",
      error: error instanceof Error ? error.message : "Não foi possível carregar as áreas.",
    }
  }
}

export function areaValuesToNumbers(values: string[], options?: AreaOption[]): number[] {
  const allowedValues = options ? new Set(options.map((option) => option.value)) : undefined
  const ids = values.map((value) => {
    if (!/^\d+$/.test(value) || Number(value) <= 0 || (allowedValues && !allowedValues.has(value))) {
      throw new Error("Selecione apenas áreas válidas.")
    }

    return Number(value)
  })

  return ids
}
