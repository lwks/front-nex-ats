import { beforeEach, describe, expect, it, vi } from "vitest"

describe("auth-session-service", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllGlobals()
  })

  it("returns authenticated session when endpoint responds with valid payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        authEnabled: true,
        authenticated: true,
        expiresAt: "2026-03-22T12:00:00.000Z",
        user: {
          sub: "abc",
          email: "dev@example.com",
          name: "Dev User",
        },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const { fetchAuthSession } = await import("@/services/auth-session-service")
    const session = await fetchAuthSession()

    expect(session).toEqual({
      authEnabled: true,
      authenticated: true,
      expiresAt: "2026-03-22T12:00:00.000Z",
      user: {
        sub: "abc",
        email: "dev@example.com",
        name: "Dev User",
      },
    })
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    })
  })

  it("returns anonymous session when endpoint returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ authEnabled: true, authenticated: false }),
      }),
    )

    const { fetchAuthSession } = await import("@/services/auth-session-service")

    await expect(fetchAuthSession()).resolves.toEqual({
      authEnabled: true,
      authenticated: false,
      expiresAt: null,
      user: null,
    })
  })

  it("preserves auth disabled state from the endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ authEnabled: false, authenticated: false }),
      }),
    )

    const { fetchAuthSession } = await import("@/services/auth-session-service")

    await expect(fetchAuthSession()).resolves.toEqual({
      authEnabled: false,
      authenticated: false,
      expiresAt: null,
      user: null,
    })
  })

  it("returns anonymous session when request throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")))
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const { fetchAuthSession } = await import("@/services/auth-session-service")
    const session = await fetchAuthSession()

    expect(session).toEqual({
      authEnabled: true,
      authenticated: false,
      expiresAt: null,
      user: null,
    })
    expect(consoleSpy).toHaveBeenCalled()
  })
})
