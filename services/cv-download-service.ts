export async function getCandidateCvDownloadUrl(candidateId: string): Promise<string> {
  const response = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}/cv-download`, { cache: 'no-store' })
  if (response.status === 403) {
    throw new Error('O download deste currículo não está disponível. Você só pode baixar currículos vinculados às vagas da sua empresa.')
  }
  if (!response.ok) throw new Error('Não foi possível preparar o download do currículo. Tente novamente em instantes.')

  const payload = await response.json().catch(() => null) as { data?: { downloadUrl?: unknown } } | null
  const downloadUrl = payload?.data?.downloadUrl
  if (typeof downloadUrl !== 'string') throw new Error('A API não retornou o link de download.')

  try {
    const url = new URL(downloadUrl)
    if (url.protocol === 'https:' || url.protocol === 'http:') return downloadUrl
  } catch { /* An invalid URL is reported below. */ }
  throw new Error('A API não retornou um link de download válido.')
}
