import { describe, expect, it, vi } from "vitest"

import { updateCandidateStatus } from "@/services/candidate-status-service"

describe("updateCandidateStatus", () => {
  it("sends the candidate status to the candidate proxy route", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "candidate-1",
        status: "novo",
        updatedAt: "2026-07-29T12:00:00.000Z",
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await updateCandidateStatus("candidate-1", "novos")

    expect(fetchMock).toHaveBeenCalledWith("/api/candidates/candidate-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "novo" }),
    })
    expect(result).toEqual({
      id: "candidate-1",
      status: "novo",
      updatedAt: "2026-07-29T12:00:00.000Z",
    })
  })

  it("throws when the upstream status update fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "status failed",
      }),
    )

    await expect(updateCandidateStatus("candidate-1", "rejeitado")).rejects.toThrow(
      "API request failed (500): status failed",
    )
  })
})
