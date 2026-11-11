import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchPublicJobDetail } from "@/services/public-job-detail-service"

describe("fetchPublicJobDetail", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("loads and normalizes a job from the production API envelope", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {
        id: "job-1",
        guid_id: "80a019c7-2d03-46ee-8514-53eb19107cbd",
        titulo: "Diretor Financeiro",
        descricao: "Descrição completa",
        cidade: "São Paulo",
        estado: "SP",
      } }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const job = await fetchPublicJobDetail("80a019c7-2d03-46ee-8514-53eb19107cbd")

    expect(fetchMock).toHaveBeenCalledWith("/api/jobs/80a019c7-2d03-46ee-8514-53eb19107cbd", {
      signal: undefined,
      cache: "no-store",
    })
    expect(job).toMatchObject({
      title: "Diretor Financeiro",
      description: "Descrição completa",
      location: "São Paulo/SP",
      applyHref: "/candidaturas?vagaGuid=80a019c7-2d03-46ee-8514-53eb19107cbd",
    })
  })

  it("rejects failed responses and invalid envelopes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    await expect(fetchPublicJobDetail("missing")).rejects.toThrow("Job request failed (404)")

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: {} }) }))
    await expect(fetchPublicJobDetail("missing")).rejects.toThrow("Invalid job response")
  })
})
