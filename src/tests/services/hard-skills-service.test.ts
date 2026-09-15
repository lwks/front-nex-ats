import { describe, expect, it } from "vitest"

import {
  getHardSkillOptionsForAreas,
  getHardSkillOptionsForCategory,
  type HardSkillCategory,
} from "@/services/hard-skills-service"

const categories: HardSkillCategory[] = [
  "engenharia-software",
  "infraestrutura",
  "dados",
  "seguranca",
  "rh",
  "financas",
  "vendas",
  "marketing",
  "produtos",
  "operacoes",
]

const areaOptions = [
  "Finanças",
  "Recursos Humanos",
  "Comercial e Vendas",
  "Marketing",
  "Produtos",
  "Operações",
  "Tecnologia da Informação",
  "Dados",
  "Riscos e Auditoria",
  "Jurídico e Compliance",
  "Supply Chain",
  "Customer Success",
  "Administração e Facilities",
].map((label, index) => ({ value: String(index + 1), label }))

describe("hard-skills-service", () => {
  it("contains a non-empty catalog for every Canva category", () => {
    categories.forEach((category) => {
      expect(getHardSkillOptionsForCategory(category).length).toBeGreaterThan(0)
    })
  })

  it.each([
    ["Finanças", "financas"],
    ["Recursos Humanos", "rh"],
    ["Comercial e Vendas", "vendas"],
    ["Marketing", "marketing"],
    ["Produtos", "produtos"],
    ["Operações", "operacoes"],
  ])("maps the direct area %s to %s", (label, category) => {
    const result = getHardSkillOptionsForAreas([String(areaOptions.findIndex((option) => option.label === label) + 1)], areaOptions)

    expect(result).toEqual(getHardSkillOptionsForCategory(category as HardSkillCategory))
  })

  it.each([
    ["Tecnologia da Informação", "engenharia-software"],
    ["Dados", "dados"],
    ["Riscos e Auditoria", "seguranca"],
    ["Jurídico e Compliance", "seguranca"],
    ["Supply Chain", "operacoes"],
    ["Customer Success", "vendas"],
    ["Administração e Facilities", "operacoes"],
  ])("maps the approximate area %s to %s", (label, category) => {
    const result = getHardSkillOptionsForAreas([String(areaOptions.findIndex((option) => option.label === label) + 1)], areaOptions)

    expect(result).toEqual(getHardSkillOptionsForCategory(category as HardSkillCategory))
  })

  it("combines multiple area lists and removes duplicate skills", () => {
    const result = getHardSkillOptionsForAreas(
      ["1", "2"],
      [
        { value: "1", label: "Finanças" },
        { value: "2", label: "Produtos" },
      ],
    )

    expect(result.length).toBe(
      new Set([
        ...getHardSkillOptionsForCategory("financas").map((option) => option.value),
        ...getHardSkillOptionsForCategory("produtos").map((option) => option.value),
      ]).size,
    )
  })

  it("returns no skills for no selection or an unknown area", () => {
    expect(getHardSkillOptionsForAreas([], areaOptions)).toEqual([])
    expect(getHardSkillOptionsForAreas(["999"], areaOptions)).toEqual([])
  })

  it("supports legacy area slugs when the API options are not available", () => {
    expect(getHardSkillOptionsForAreas(["tecnologia-informacao-ti"], [])).toEqual(
      getHardSkillOptionsForCategory("engenharia-software"),
    )
  })
})
