import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchCompanyReportData } from "@/services/company-report-service"

describe("fetchCompanyReportData", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("loads paginated jobs and then resolves candidates by guid_vaga", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: [{ id: "job-1", guid_id: "guid-1", titulo: "Pessoa Desenvolvedora" }],
            lastKey: "cursor-1",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: [{ id: "job-2", guid_id: "guid-2", titulo: "Analista de Dados" }],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: "cand-1", guid_vaga: "guid-1", etapa: "triagem inicial" },
            { id: "cand-2", guid_vaga: "guid-2", etapa: "proposta" },
          ],
        }),
      })

    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchCompanyReportData()

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/jobs?limit=50", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/jobs?limit=50&lastKey=cursor-1", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/candidates/by-job-guids?guid_vaga=guid-1&guid_vaga=guid-2", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    expect(result.jobs.map((job) => job.title)).toEqual(["Pessoa Desenvolvedora", "Analista de Dados"])
    expect(result.candidates.map((candidate) => candidate.stage)).toEqual(["Novos", "Proposta"])
  })

  it("propagates candidate loading errors", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            items: [{ id: "job-1", guid_id: "guid-1", titulo: "Pessoa Desenvolvedora" }],
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: "Bad gateway",
        text: async () => "candidate upstream error",
      })

    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchCompanyReportData()).rejects.toThrow(
      "API request failed (502): candidate upstream error",
    )
  })
})
