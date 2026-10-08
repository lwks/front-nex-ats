import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, relative } from "node:path"

import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter"

import { buildProductionMarkdownReport, type Gap, type ScenarioResult } from "../support/report-data"
import { productionReportPath, productionRunId, readRunState } from "../support/runtime"

function redact(value: string) {
  return value
    .replace(/\x1b\[[0-9;]*m/g, "")
    .replace(/sb_secret_[A-Za-z0-9._-]+/g, "[SEGREDO REDIGIDO]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[TOKEN REDIGIDO]")
    .replace(/([?&](?:access_token|refresh_token|token|code)=)[^&\s]+/gi, "$1[REDIGIDO]")
    .slice(0, 500)
}

function statusFor(result: TestResult): ScenarioResult["status"] {
  if (result.status === "passed") return "passou"
  if (result.status === "skipped") {
    return result.annotations.some((annotation) => annotation.type === "blocked") ? "bloqueado" : "nao executado"
  }
  return "falhou"
}

function scenarioFor(test: TestCase) {
  const path = test.titlePath()
  return path.length > 1 ? path[path.length - 2] : "Produção"
}

function evidenceFor(result: TestResult) {
  const blockedReason = result.annotations.find((annotation) => annotation.type === "blocked")?.description
  if (result.status === "skipped" && blockedReason) return blockedReason
  const artifactPaths = result.attachments
    .filter((attachment) => attachment.path)
    .map((attachment) => relative(process.cwd(), attachment.path as string))
    .filter((path, index, paths) => paths.indexOf(path) === index)
  const error = result.error?.message ? redact(result.error.message.split("\n")[0]) : ""
  return [error, artifactPaths.length ? `artefatos: ${artifactPaths.join(", ")}` : ""].filter(Boolean).join("; ") || "Execução concluída sem erro."
}

function parseGap(description: string | undefined): Gap | null {
  if (!description) return null
  try {
    return JSON.parse(description) as Gap
  } catch {
    return null
  }
}

export default class MarkdownProductionReporter implements Reporter {
  private scenarios: ScenarioResult[] = []
  private gaps: Gap[] = []
  private startedAt = new Date().toISOString()

  onBegin() {
    this.startedAt = readRunState().startedAt
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const evidence = evidenceFor(result)
    this.scenarios.push({ scenario: scenarioFor(test), title: test.title, status: statusFor(result), evidence })
    const annotatedGaps = result.annotations
      .filter((annotation) => annotation.type === "gap")
      .map((annotation) => parseGap(annotation.description))
      .filter((gap): gap is Gap => Boolean(gap))
    this.gaps.push(...annotatedGaps)
    if (result.status !== "passed" && result.status !== "skipped" && annotatedGaps.length === 0) {
      this.gaps.push({
        severity: "alto",
        title: test.title,
        expected: "O cenário deveria concluir sem erros.",
        observed: evidence,
        impact: "O fluxo coberto pelo cenário não está comprovado no deploy.",
        recommendation: "Reproduzir pelo trace, corrigir a causa e executar novamente a suíte de produção.",
        evidence,
      })
    }
  }

  onEnd() {
    const runId = productionRunId()
    const state = readRunState(runId)
    const report = buildProductionMarkdownReport({
      runId,
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      baseUrl: state.baseUrl,
      deployEvidence: state.deployEvidence,
      scenarios: this.scenarios,
      gaps: this.gaps,
      temporaryUsers: state.temporaryUsers,
      externalRecords: state.externalRecords,
    })
    const outputPath = productionReportPath(runId)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, report, "utf8")
    console.log(`Relatório de produção: ${outputPath}`)
  }
}
