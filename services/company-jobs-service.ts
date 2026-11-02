export type CompanyJobCloseResult = Record<string, unknown>

export async function closeCompanyJob(jobId: string, reason: string) {
  const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motivo_encerramento: reason.trim() || undefined }),
  })
  const payload = await response.json().catch(() => null) as { data?: CompanyJobCloseResult; message?: string } | null
  if (!response.ok) throw new Error(payload?.message ?? "Não foi possível encerrar a vaga.")
  return payload?.data ?? {}
}
