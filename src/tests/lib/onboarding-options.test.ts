import { describe, expect, it } from "vitest"

import { filterAreaSelectionsByRoles, resolveAreaValuesForRoles, topSectorOptions } from "@/lib/onboarding-options"

describe("onboarding-options area mapping", () => {
  it("combines area values for the selected cargos without duplicates", () => {
    expect(resolveAreaValuesForRoles(["tech-lead", "desenvolvedor-full-stack"])).toEqual([
      "3",
      "1",
      "4",
      "12",
    ])
  })

  it("removes incompatible selected areas when the cargos change", () => {
    expect(
      filterAreaSelectionsByRoles(
        ["project-manager"],
        ["3", "1", "13"],
      ),
    ).toEqual(["3", "13"])
  })

  it("exposes the shared top-sector catalog used across the flow", () => {
    expect(topSectorOptions).toHaveLength(15)
    expect(topSectorOptions.map((option) => option.value)).toEqual([
      "agronegocio",
      "alimentos-bebidas",
      "comercio-varejista",
      "construcao-civil",
      "desenvolvimento-software",
      "ecommerce-marketplaces",
      "energia",
      "engenharia-projetos-industriais",
      "financeiro-bancario",
      "industria-automotiva",
      "industria-farmaceutica",
      "logistica-transporte",
      "saude-servicos-hospitalares",
      "seguros-previdencia",
      "tecnologia-informacao-ti",
    ])
  })
})
