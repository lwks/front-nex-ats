import { describe, expect, it } from "vitest"

import {
  defaultTeamOptionsByCategory,
  filterAreaSelectionsByRoles,
  getTeamOptionsForAreas,
  normalizeSeniorityValues,
  normalizeTeamValueForAreas,
  normalizeTeamValues,
  resolveAreaValuesForRoles,
  topSectorOptions,
} from "@/lib/onboarding-options"

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

  it("maps all current areas to the five team categories", () => {
    const areaOptions = [
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

    expect(getTeamOptionsForAreas(["1"], areaOptions)).toEqual(defaultTeamOptionsByCategory.financas)
    expect(getTeamOptionsForAreas(["2"], areaOptions)).toEqual(defaultTeamOptionsByCategory.rh)
    expect(getTeamOptionsForAreas(["3", "4"], areaOptions)).toEqual(defaultTeamOptionsByCategory.tecnologia)
    expect(getTeamOptionsForAreas(["5", "11", "12"], areaOptions)).toEqual(
      defaultTeamOptionsByCategory.vendas,
    )
    expect(getTeamOptionsForAreas(["7", "8", "9", "10", "13"], areaOptions)).toEqual(
      defaultTeamOptionsByCategory.operacoes,
    )
  })

  it("unites multiple categories without duplicates and sorts them alphabetically", () => {
    const areaOptions = [
      { value: "1", label: "Finanças" },
      { value: "2", label: "Recursos Humanos" },
    ]
    const options = getTeamOptionsForAreas(["1", "2"], areaOptions)
    const labels = options.map((option) => option.label)

    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toEqual([...labels].sort((first, second) => first.localeCompare(second, "pt-BR")))
    expect(labels).toContain("Controladoria")
    expect(labels).toContain("Talent Acquisition")
  })

  it("clears a team that is not allowed by the selected areas", () => {
    const areaOptions = [{ value: "1", label: "Finanças" }]

    expect(normalizeTeamValueForAreas(["Controladoria"], ["1"], areaOptions)).toEqual(["Controladoria"])
    expect(normalizeTeamValueForAreas(["Controladoria", "Desenvolvimento Front-end"], ["1"], areaOptions)).toEqual([
      "Controladoria",
    ])
    expect(normalizeTeamValueForAreas(["Costumer Success"], ["1"], areaOptions)).toEqual([])
  })

  it("normalizes legacy scalar values and caps team selections at three", () => {
    const areaOptions = [{ value: "3", label: "Tecnologia da Informação" }]

    expect(normalizeTeamValueForAreas("Desenvolvimento Front-end", ["3"], areaOptions)).toEqual([
      "Desenvolvimento Front-end",
    ])
    expect(
      normalizeTeamValueForAreas(
        ["Desenvolvimento Front-end", "Desenvolvimento Back-end", "DevOps", "UX Design"],
        ["3"],
        areaOptions,
      ),
    ).toEqual(["Desenvolvimento Front-end", "Desenvolvimento Back-end", "DevOps"])
  })

  it("normalizes legacy team selections into unique catalog values", () => {
    expect(normalizeTeamValues(" Desenvolvimento Front-end ")).toEqual(["Desenvolvimento Front-end"])
    expect(
      normalizeTeamValues([
        "Desenvolvimento Front-end",
        "Desenvolvimento Front-end",
        "DevOps",
        "UX Design",
        "Time desconhecido",
      ]),
    ).toEqual(["Desenvolvimento Front-end", "DevOps", "UX Design"])
  })

  it("normalizes legacy seniority preferences and caps them at three", () => {
    expect(normalizeSeniorityValues("senior")).toEqual(["senior"])
    expect(normalizeSeniorityValues(["pleno", "senior", "senior", "especialista", "gerente", "desconhecida"]))
      .toEqual(["pleno", "senior", "especialista"])
  })
})
