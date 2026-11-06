import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { GET, OPTIONS, PUT } from "@/app/api/candidates/[id]/route"
const apiAuthorization = vi.hoisted(() => ({
  authorize: vi.fn().mockResolvedValue({ ok: true, accessToken: 'test-access-token' }),
}))
vi.mock('@/lib/auth/require-api-account-type', () => ({ authorizeApiAccountType: apiAuthorization.authorize }))

describe("/api/candidates/[id] route", () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => {
    apiAuthorization.authorize.mockResolvedValue({ ok: true, accessToken: 'test-access-token' })
  })

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
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/candidates/candidate-1'),
      expect.objectContaining({ headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-access-token',
      } }),
    )
  })

  it('loads the company-owned application by ID with the bearer token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"data":{"nome":"Ana"}}', { status: 200 })))
    const response = await GET(new Request('http://localhost/api/candidates/candidate-1'), { params: Promise.resolve({ id: 'candidate-1' }) })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ data: { nome: 'Ana' } })
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/candidates/candidate-1'),
      expect.objectContaining({ headers: { Authorization: 'Bearer test-access-token' } }))
  })

  it('does not fetch application details without a company account', async () => {
    apiAuthorization.authorize.mockResolvedValueOnce({ ok: false, response: new Response(null, { status: 403 }) })
    const upstream = vi.fn(); vi.stubGlobal('fetch', upstream)
    const response = await GET(new Request('http://localhost/api/candidates/candidate-1'), { params: Promise.resolve({ id: 'candidate-1' }) })
    expect(response.status).toBe(403)
    expect(upstream).not.toHaveBeenCalled()
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
