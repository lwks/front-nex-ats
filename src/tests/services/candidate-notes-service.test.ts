import { describe, expect, it, vi } from "vitest"

import { updateCandidateNotes } from "@/services/candidate-notes-service"

describe("updateCandidateNotes", () => {
  it("sends the recruiter note to the candidate proxy route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "candidate-1",
        anotacoes: "Perfil forte para a proxima etapa",
        updatedAt: "2026-07-28T12:00:00.000Z",
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await updateCandidateNotes("candidate-1", " Perfil forte para a proxima etapa ")

    expect(fetchMock).toHaveBeenCalledWith("/api/candidates/candidate-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anotacoes: "Perfil forte para a proxima etapa" }),
    })
    expect(result).toEqual({
      id: "candidate-1",
      notes: "Perfil forte para a proxima etapa",
      updatedAt: "2026-07-28T12:00:00.000Z",
    })
  })

  it("throws when the upstream update fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        statusText: "Conflict",
        text: async () => "candidate locked",
      }),
    )

    await expect(updateCandidateNotes("candidate-1", "nota")).rejects.toThrow(
      "API request failed (409): candidate locked",
    )
  })
})
