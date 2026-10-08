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
  temporaryUsers: Array<{ email: string; purpose: string; removed: boolean; cleanupError?: string }>
  externalRecords: Array<{ type: string; identifier: string }>
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
    ? input.temporaryUsers.map((user) => `- ${user.email} (${user.purpose}): ${user.removed ? "removido" : `nao removido${user.cleanupError ? ` - ${user.cleanupError}` : ""}`}`).join("\n")
    : "- Nenhum usuário temporário foi criado."
  const records = input.externalRecords.length > 0
    ? input.externalRecords.map((record) => `- ${record.type}: \`${record.identifier}\``).join("\n")
    : "- Nenhum registro externo foi criado."

  return `# Relatório E2E do deploy ATS\n\n- Ambiente: produção\n- URL: ${input.baseUrl}\n- Início: ${input.startedAt}\n- Término: ${input.finishedAt}\n- Identificador: \`${input.runId}\`\n\n## Deploy testado\n\n${deployEvidence}\n\n## Cenários\n\n| Grupo | Cenário | Resultado | Evidência |\n| --- | --- | --- | --- |\n${scenarioRows}\n\n## GAPs\n\n${gapSections}\n\n## Limitações conhecidas\n\n- O recebimento do e-mail, o uso do link de confirmação e a recuperação de senha não são comprovados automaticamente.\n- GitHub e LinkedIn são validados somente até a solicitação ao provedor; nenhuma conta social é autenticada.\n- A API ATS não oferece exclusão pela interface atual; os registros externos abaixo permanecem marcados para limpeza.\n- O relatório e os artefatos não contêm senhas, tokens ou chaves administrativas.\n\n## Usuários temporários\n\n${users}\n\n## Registros externos deixados para limpeza\n\n${records}\n`
}
