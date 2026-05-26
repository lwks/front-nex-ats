import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchPublicJobsPage } from "@/services/public-jobs-service"

describe("fetchPublicJobsPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("requests the initial page using the jobs proxy", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          items: [{ id: "job-1", titulo: "Pessoa Desenvolvedora", guid_id: "guid-1" }],
          lastKey: "cursor-1",
        },
      }),
    })

    vi.stubGlobal("fetch", fetchMock)

    const result = await fetchPublicJobsPage()

    expect(fetchMock).toHaveBeenCalledWith("/api/jobs?limit=6", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: undefined,
    })
    expect(result.lastKey).toBe("cursor-1")
    expect(result.jobs[0].applyHref).toBe("/candidaturas?vagaGuid=guid-1")
  })

  it("passes the cursor when loading more jobs", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          items: [{ id: "job-2", title: "UX Designer" }],
        },
      }),
    })

    vi.stubGlobal("fetch", fetchMock)

    await fetchPublicJobsPage({ limit: 3, lastKey: "cursor-2" })

    expect(fetchMock).toHaveBeenCalledWith("/api/jobs?limit=3&lastKey=cursor-2", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: undefined,
    })
  })

  it("propagates upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: "Bad gateway",
        text: async () => "upstream error",
      }),
    )

    await expect(fetchPublicJobsPage({ lastKey: "cursor-2" })).rejects.toThrow(
      "API request failed (502): upstream error",
    )
  })
})
