import { apiFetch } from "@/services/api-client"

export type AreaCompetency = { DS_COMPETENCIA: string; DS_TIPO_COMPETENCIA: string }
export type AreaApiRecord = { ID: number; DS_AREA: string; competencias?: AreaCompetency[] }
export type AreaOption = { value: string; label: string; competencias?: AreaCompetency[] }
export type AreaOptionsLoadResult = { options: AreaOption[]; source: "api" | null; error?: string }

function normalizeAreaRecord(area: AreaApiRecord): AreaOption {
  if (!Number.isFinite(area.ID) || !Number.isInteger(area.ID) || area.ID <= 0 || !String(area.DS_AREA ?? "").trim()) {
    throw new Error("Registro de área inválido")
  }
  return { value: String(area.ID), label: area.DS_AREA, ...(area.competencias ? { competencias: area.competencias } : {}) }
}

export function normalizeAreaResponse(payload: unknown): AreaOption[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) throw new Error("Resposta inválida para /api/areas")
  return (payload as { data: AreaApiRecord[] }).data.map(normalizeAreaRecord)
}
export async function fetchAreaOptions(): Promise<AreaOption[]> {
  const payload = await apiFetch<{ data?: AreaApiRecord[] }>("/areas")
  return normalizeAreaResponse(payload)
}
export async function loadAreaOptions(): Promise<AreaOptionsLoadResult> {
  try { return { options: await fetchAreaOptions(), source: "api" } }
  catch (error) { return { options: [], source: null, error: error instanceof Error ? error.message : "Não foi possível carregar as áreas." } }
}
export function areaValuesToNumbers(values: string[], options?: AreaOption[]): number[] {
  const allowedValues = options ? new Set(options.map((option) => option.value)) : undefined
  return values.map((value) => {
    if (!/^\d+$/.test(value) || Number(value) <= 0 || (allowedValues && !allowedValues.has(value))) throw new Error("Selecione apenas áreas válidas.")
    return Number(value)
  })
}