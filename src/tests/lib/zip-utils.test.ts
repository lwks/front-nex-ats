import { describe, expect, it } from "vitest"

import { formatZipSummary, normalizeZipResponse } from "@/lib/zip-utils"

describe("zip utils", () => {
  it("normaliza resposta com objeto aninhado e preenche cep", () => {
    const normalized = normalizeZipResponse(
      {
        data: {
          localidade: "São Paulo",
          uf: "SP",
        },
      },
      "01310100",
    )

    expect(normalized.localidade).toBe("São Paulo")
    expect(normalized.uf).toBe("SP")
    expect(normalized.cep).toBe("01310100")
  })

  it("extrai cidade e estado quando a API devolve data como string", () => {
    const normalized = normalizeZipResponse(
      {
        data: "Rua Exemplo - Centro - São Paulo/SP",
      },
      "01310100",
    )

    expect(normalized.localidade).toBe("São Paulo")
    expect(normalized.cidade).toBe("São Paulo")
    expect(normalized.uf).toBe("SP")
    expect(normalized.estado).toBe("SP")
    expect(formatZipSummary(normalized)).toBe("São Paulo/SP")
  })

  it("mantem cidade e estado vazios quando data string nao possui Cidade/UF", () => {
    const normalized = normalizeZipResponse(
      {
        data: "Rua Exemplo - Centro",
      },
      "01310100",
    )

    expect(normalized.localidade).toBeUndefined()
    expect(normalized.uf).toBeUndefined()
    expect(formatZipSummary(normalized)).toBe("01310100")
  })
})
