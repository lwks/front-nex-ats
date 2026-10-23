export type AreaOption = { value: string; label: string }

export const hardcodedAreaOptions: AreaOption[] = [
  "Finanças",
  "Recursos Humanos",
  "Tecnologia da Informação",
  "Dados",
  "Comercial e Vendas",
  "Marketing",
  "Operações",
  "Supply Chain",
  "Jurídico e Compliance",
  "Riscos e Auditoria",
  "Customer Success",
  "Produtos",
  "Administração e Facilities",
].map((label, index) => ({ value: String(index + 1), label }))

export async function fetchAreaOptions(): Promise<AreaOption[]> {
  return hardcodedAreaOptions
}

export function areaValuesToNumbers(values: string[], options: AreaOption[] = hardcodedAreaOptions): number[] {
  const allowedValues = new Set(options.map((option) => option.value))
  return values.map((value) => {
    if (!/^\d+$/.test(value) || Number(value) <= 0 || !allowedValues.has(value)) throw new Error("Selecione apenas áreas válidas.")
    return Number(value)
  })
}
