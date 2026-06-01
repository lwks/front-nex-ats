import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ATS_NAV_ITEMS, AtsSidebar } from "@/components/ats-sidebar"

describe("AtsSidebar", () => {
  it("keeps the report navigation item available in the main sidebar", () => {
    expect(ATS_NAV_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "relatorio", href: "/empresa/relatorio", label: "Relatorio" }),
      ]),
    )
  })

  it("renders the report route link and highlights the active item", () => {
    const html = renderToStaticMarkup(<AtsSidebar activeItem="relatorio" />)

    expect(html).toContain('href="/empresa/relatorio"')
    expect(html).toContain('aria-current="page"')
    expect(html).toContain("Indicadores operacionais")
  })
})
