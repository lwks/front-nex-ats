import { describe, expect, it } from "vitest"

import { buildProductionMarkdownReport } from "@/e2e-production/support/report-data"
import { createRunIdentifier } from "@/e2e-production/support/runtime"

describe("production E2E report helpers", () => {
  it("creates a stable run identifier from a known date and suffix", () => {
    expect(createRunIdentifier(new Date("2026-10-06T12:34:56.000Z"), "abc123")).toBe("E2E-20261006T123456Z-abc123")
  })

  it("renders passed, blocked and gap evidence without exposing unspecified secrets", () => {
    const report = buildProductionMarkdownReport({
      runId: "E2E-test",
      startedAt: "2026-10-06T12:00:00.000Z",
      finishedAt: "2026-10-06T12:01:00.000Z",
      baseUrl: "https://example.netlify.app",
      deployEvidence: { "x-nf-request-id": "request-1" },
      scenarios: [
        { scenario: "Preflight", title: "abre a home", status: "passou", evidence: "HTTP 200" },
        { scenario: "Autenticação", title: "faz login", status: "bloqueado", evidence: "authEnabled=false" },
      ],
      gaps: [{
        severity: "critico",
        title: "Supabase desabilitado",
        expected: "authEnabled=true",
        observed: "authEnabled=false",
        impact: "Login indisponível",
        recommendation: "Configurar o build e publicar novamente",
        evidence: "/api/auth/session",
      }],
      temporaryUsers: [{ email: "candidate@example.com", purpose: "candidate", removed: true }],
      externalRecords: [{ type: "job", identifier: "E2E-test" }],
    })

    expect(report).toContain("| Preflight | abre a home | passou | HTTP 200 |")
    expect(report).toContain("[CRITICO] Supabase desabilitado")
    expect(report).toContain("candidate@example.com (candidate): removido")
    expect(report).toContain("job: `E2E-test`")
  })
})
