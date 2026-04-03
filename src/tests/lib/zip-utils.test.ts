import { describe, expect, it } from "vitest"

import { formatZipSummary, normalizeZipResponse } from "@/lib/zip-utils"

describe("zip utils", () => {
  it("normaliza resposta com objeto aninhado e preenche cep", () => {
    const normalized = normalizeZipResponse(
      {
        data: {
          localidade: "S\u00E3o Paulo",
          uf: "SP",
        },
      },
      "01310100",
    )

    expect(normalized.localidade).toBe("S\u00E3o Paulo")
    expect(normalized.uf).toBe("SP")
    expect(normalized.cep).toBe("01310100")
  })

  it("extrai cidade e estado quando a API devolve data como string", () => {
    const address = "Rua Exemplo - Centro - S\u00E3o Paulo/SP"
    const normalized = normalizeZipResponse(
      {
        data: address,
      },
      "01310100",
    )

    expect(normalized.localidade).toBe("S\u00E3o Paulo")
    expect(normalized.cidade).toBe("S\u00E3o Paulo")
    expect(normalized.uf).toBe("SP")
    expect(normalized.estado).toBe("SP")
    expect(formatZipSummary(normalized)).toBe(address)
  })

  it("usa o endereco bruto quando data string nao possui Cidade/UF", () => {
    const normalized = normalizeZipResponse(
      {
        data: "Rua Exemplo - Centro",
      },
      "01310100",
    )

    expect(normalized.localidade).toBeUndefined()
    expect(normalized.uf).toBeUndefined()
    expect(formatZipSummary(normalized)).toBe("Rua Exemplo - Centro")
  })

  it("mantem fallback para o CEP quando nao ha endereco retornado", () => {
    const normalized = normalizeZipResponse(null, "01310100")

    expect(formatZipSummary(normalized)).toBe("01310100")
  })
})
