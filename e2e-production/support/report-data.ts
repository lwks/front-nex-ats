export type ScenarioResult = {
  scenario: string
  title: string
  status: "passou" | "falhou" | "bloqueado" | "nao executado"
  evidence: string
}

export type Gap = {
  severity: "critico" | "alto" | "medio" | "baixo"
  title: string
  expected: string
  observed: string
  impact: string
  recommendation: string
  evidence: string
}

export type MarkdownReportInput = {
  runId: string
  startedAt: string
  finishedAt: string
  baseUrl: string
  deployEvidence: Record<string, string>
  scenarios: ScenarioResult[]
  gaps: Gap[]
  temporaryUsers: Array<{ id?: string; email: string; purpose: string; removed: boolean; cleanupError?: string }>
  externalRecords: Array<{
    type: string
    identifier: string
    id?: string
    relatedId?: string
    creationStatus?: "submitted" | "confirmed"
    cleanupStatus?: "pending" | "removed" | "failed"
    cleanupError?: string
  }>
}

function escapeCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ")
}

export function buildProductionMarkdownReport(input: MarkdownReportInput) {
  const deployEvidence = Object.entries(input.deployEvidence)
    .map(([key, value]) => `- ${key}: \`${value}\``)
    .join("\n") || "- Nenhum identificador de deploy foi exposto pelos headers HTTP."
  const scenarioRows = input.scenarios
    .map((item) => `| ${escapeCell(item.scenario)} | ${escapeCell(item.title)} | ${item.status} | ${escapeCell(item.evidence)} |`)
    .join("\n") || "| - | Nenhum cenário executado | nao executado | - |"
  const gapSections = input.gaps.length > 0
    ? input.gaps.map((gap, index) => [
        `### ${index + 1}. [${gap.severity.toUpperCase()}] ${gap.title}`,
        "",
        `- Esperado: ${gap.expected}`,
        `- Observado: ${gap.observed}`,
        `- Evidência: ${gap.evidence}`,
        `- Impacto: ${gap.impact}`,
        `- Correção recomendada: ${gap.recommendation}`,
      ].join("\n")).join("\n\n")
    : "Nenhum GAP foi identificado nesta execução."
  const users = input.temporaryUsers.length > 0
    ? input.temporaryUsers.map((user) => `- ${user.email} (${user.purpose})${user.id ? ` — ID \`${user.id}\`` : ""}: ${user.removed ? "removido" : "mantido em produção"}`).join("\n")
    : "- Nenhum usuário temporário foi criado."
  const records = input.externalRecords.length > 0
    ? input.externalRecords.map((record) => {
        const status = record.cleanupStatus === "removed" ? "removido" : record.creationStatus === "submitted" ? "envio observado; gravação não confirmada" : "mantido em produção para inspeção"
        return `- ${record.type}: \`${record.identifier}\`${record.id ? ` (ID \`${record.id}\`)` : ""}${record.relatedId ? `; vaga vinculada \`${record.relatedId}\`` : ""} — ${status}`
      }).join("\n")
    : "- Nenhum registro externo foi criado."

  return `# Relatório E2E do deploy ATS\n\n- Ambiente: produção\n- URL: ${input.baseUrl}\n- Início: ${input.startedAt}\n- Término: ${input.finishedAt}\n- Identificador: \`${input.runId}\`\n\n## Deploy testado\n\n${deployEvidence}\n\n## Cenários\n\n| Grupo | Cenário | Resultado | Evidência |\n| --- | --- | --- | --- |\n${scenarioRows}\n\n## GAPs\n\n${gapSections}\n\n## Limitações conhecidas\n\n- O recebimento do e-mail, o uso do link de confirmação e a recuperação de senha não são comprovados automaticamente.\n- GitHub e LinkedIn são validados somente até a solicitação ao provedor; nenhuma conta social é autenticada.\n- Erros simulados no navegador não comprovam falha da API real.\n- O relatório e os artefatos não contêm senhas, tokens ou chaves administrativas.\n\n## Contas sintéticas mantidas\n\n${users}\n\n## Vagas, candidaturas e notas mantidas\n\n${records}\n`
}
