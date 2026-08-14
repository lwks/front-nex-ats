import { describe, expect, it, vi } from "vitest"

import {
  areaValuesToNumbers,
  fallbackAreaOptions,
  fetchAreaOptions,
  loadAreaOptions,
  normalizeAreaResponse,
} from "@/services/areas-service"

describe("areas-service", () => {
  it("normalizes the API envelope and preserves the returned label", () => {
    expect(normalizeAreaResponse({ data: [{ ID: 1, DS_AREA: "Finanças" }] })).toEqual([
      { value: "1", label: "Finanças" },
    ])
  })

  it.each([
    { ID: 0, DS_AREA: "Tecnologia" },
    { ID: 1.5, DS_AREA: "Tecnologia" },
    { ID: 1, DS_AREA: "" },
  ])("rejects an invalid area record", (record) => {
    expect(() => normalizeAreaResponse({ data: [record] })).toThrow("Registro de área inválido")
  })

  it("rejects an invalid response envelope", () => {
    expect(() => normalizeAreaResponse({ data: "invalid" })).toThrow("Resposta inválida para /api/areas")
  })

  it("loads API options successfully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [{ ID: 2, DS_AREA: "Recursos Humanos" }] }) }),
    )

    await expect(fetchAreaOptions()).resolves.toEqual([{ value: "2", label: "Recursos Humanos" }])
    await expect(loadAreaOptions()).resolves.toEqual({
      options: [{ value: "2", label: "Recursos Humanos" }],
      source: "api",
    })
  })

  it("returns the explicit local fallback after an API failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, text: async () => "unavailable" }))

    const result = await loadAreaOptions()

    expect(result.source).toBe("fallback")
    expect(result.options).toEqual(fallbackAreaOptions)
    expect(result.error).toContain("503")
  })

  it("converts selected string IDs and rejects values outside the loaded catalog", () => {
    const options = [{ value: "1", label: "Finanças" }]

    expect(areaValuesToNumbers(["1"], options)).toEqual([1])
    expect(() => areaValuesToNumbers(["slug"], options)).toThrow("Selecione apenas áreas válidas.")
    expect(() => areaValuesToNumbers(["2"], options)).toThrow("Selecione apenas áreas válidas.")
  })
})
