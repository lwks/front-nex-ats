import { describe, expect, it, vi } from "vitest"

import { OPTIONS, PUT } from "@/app/api/candidates/[id]/route"

describe("/api/candidates/[id] route", () => {
  it("proxies candidate note updates with upstream status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        headers: new Headers({ "Content-Type": "application/json" }),
        text: async () => '{"id":"candidate-1","anotacoes":"Perfil aprovado"}',
      }),
    )

    const request = new Request("http://localhost/api/candidates/candidate-1", {
      method: "PUT",
      body: JSON.stringify({ anotacoes: "Perfil aprovado" }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: "candidate-1" }) })

    expect(response.status).toBe(200)
    expect(await response.text()).toBe('{"id":"candidate-1","anotacoes":"Perfil aprovado"}')
  })

  it("returns 500 when the proxy update throws", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")))
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)

    const request = new Request("http://localhost/api/candidates/candidate-1", {
      method: "PUT",
      body: JSON.stringify({ anotacoes: "Perfil aprovado" }),
    })

    const response = await PUT(request, { params: Promise.resolve({ id: "candidate-1" }) })

    expect(response.status).toBe(500)
    expect(consoleSpy).toHaveBeenCalled()
  })

  it("exposes preflight support", async () => {
    const response = await OPTIONS()

    expect(response.status).toBe(204)
  })
})
