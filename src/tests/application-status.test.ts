import { describe, expect, it } from "vitest"

import { mapApiStatusToBoardStatus, mapBoardStatusToApiStatus } from "@/lib/application-status"

describe("application status contract", () => {
  it("translates the plural visual column to the singular API value", () => {
    expect(mapBoardStatusToApiStatus("novos")).toBe("novo")
    expect(mapBoardStatusToApiStatus("entrevista-tecnica")).toBe("entrevista-tecnica")
  })

  it("normalizes the API value back to the visual column", () => {
    expect(mapApiStatusToBoardStatus("novo")).toBe("novos")
    expect(mapApiStatusToBoardStatus("reprovado")).toBe("rejeitado")
    expect(mapApiStatusToBoardStatus("valor-desconhecido")).toBe("novos")
  })
})
