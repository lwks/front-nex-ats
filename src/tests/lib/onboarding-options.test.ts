import { describe, expect, it } from "vitest"

import { filterAreaSelectionsByRoles, resolveAreaValuesForRoles } from "@/lib/onboarding-options"

describe("onboarding-options area mapping", () => {
  it("combines area values for the selected cargos without duplicates", () => {
    expect(resolveAreaValuesForRoles(["tech-lead", "desenvolvedor-full-stack"])).toEqual([
      "desenvolvimento-software",
      "tecnologia-informacao-ti",
      "financeiro-bancario",
      "ecommerce-marketplaces",
    ])
  })

  it("removes incompatible selected areas when the cargos change", () => {
    expect(
      filterAreaSelectionsByRoles(
        ["project-manager"],
        ["tecnologia-informacao-ti", "financeiro-bancario", "construcao-civil"],
      ),
    ).toEqual(["tecnologia-informacao-ti", "construcao-civil"])
  })
})
