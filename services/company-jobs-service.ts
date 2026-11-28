export type CompanyJobCloseResult = { status?: string; ciclo_atual?: number; motivo_encerramento?: string }

export async function closeCompanyJob(jobId: string, reason: string, cycle = 1) {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo_encerramento: reason.trim() || undefined, ciclo: cycle }),
  })
  const payload = await response.json().catch(() => null) as { data?: CompanyJobCloseResult; message?: string } | null
  if (!response.ok) throw new Error(response.status === 409 ? 'A vaga mudou. Recarregue a página antes de encerrar.' : 'Não foi possível encerrar a vaga. Tente novamente mais tarde.')
  if (payload?.data?.status !== 'Encerrada' || payload.data.ciclo_atual !== cycle) throw new Error('Não foi possível confirmar o encerramento. Recarregue a página antes de tentar novamente.')
  return payload.data
}

export async function reopenCompanyJob(jobId: string, cycle: number) {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/reopen`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ciclo: cycle }),
  })
  const payload = await response.json().catch(() => null) as { data?: CompanyJobCloseResult } | null
  if (!response.ok) throw new Error(response.status === 409 ? 'A vaga mudou. Recarregue a página antes de reabrir.' : 'Não foi possível reabrir a vaga. Tente novamente mais tarde.')
  if (payload?.data?.status !== 'Aberto' || payload.data.ciclo_atual !== cycle + 1) throw new Error('Não foi possível confirmar a reabertura. Recarregue a página antes de tentar novamente.')
  return payload.data
}
