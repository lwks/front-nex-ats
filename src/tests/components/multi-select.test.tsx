import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import {
  buildMultiSelectSummary,
  MultiSelect,
  toggleMultiSelectValue,
} from "@/components/ui/multi-select"

const options = [
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Hibrido" },
  { value: "presencial", label: "Presencial" },
]

describe("multi-select", () => {
  it("builds a compact summary for selected values", () => {
    expect(buildMultiSelectSummary(options, [], "Selecione")).toBe("Selecione")
    expect(buildMultiSelectSummary(options, ["remoto"], "Selecione")).toBe("Remoto")
    expect(buildMultiSelectSummary(options, ["remoto", "hibrido", "presencial"], "Selecione")).toBe(
      "Remoto, Hibrido +1",
    )
  })

  it("toggles values in a stable array contract", () => {
    expect(toggleMultiSelectValue(["remoto"], "hibrido")).toEqual(["remoto", "hibrido"])
    expect(toggleMultiSelectValue(["remoto", "hibrido"], "remoto")).toEqual(["hibrido"])
  })

  it("renders the current selection summary", () => {
    const html = renderToStaticMarkup(
      <MultiSelect
        options={options}
        placeholder="Selecione"
        value={["remoto", "hibrido"]}
        onChange={vi.fn()}
      />,
    )

    expect(html).toContain("Remoto, Hibrido")
  })
})
