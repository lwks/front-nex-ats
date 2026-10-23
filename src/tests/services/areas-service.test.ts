import { describe, expect, it, vi } from "vitest"

import {
  areaValuesToNumbers,
  hardcodedAreaOptions,
  fetchAreaOptions,
} from "@/services/areas-service"

describe("areas-service", () => {
  it("provides all fixed areas with stable numeric IDs", () => {
    expect(hardcodedAreaOptions).toEqual([
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
    ].map((label, index) => ({ value: String(index + 1), label })))
  })

  it("loads the local catalog without calling the API", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchAreaOptions()).resolves.toEqual(hardcodedAreaOptions)
    expect(fetchMock).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it("converts selected string IDs and rejects values outside the loaded catalog", () => {
    const options = [{ value: "1", label: "Finanças" }]

    expect(areaValuesToNumbers(["1"], options)).toEqual([1])
    expect(() => areaValuesToNumbers(["slug"], options)).toThrow("Selecione apenas áreas válidas.")
    expect(() => areaValuesToNumbers(["2"], options)).toThrow("Selecione apenas áreas válidas.")
  })

  it("uses the fixed catalog to validate candidate area IDs", () => {
    expect(areaValuesToNumbers(["1", "13"])).toEqual([1, 13])
    expect(() => areaValuesToNumbers(["14"])).toThrow("Selecione apenas áreas válidas.")
  })

})
