import { CANDIDATES_API_PROXY_URL } from "@/config"
import { areaValuesToNumbers } from "@/services/areas-service"
import { validateUserRegistrationData, type UserRegistrationData } from "@/services/user-registration-service"

export type CandidateProfilePayload = UserRegistrationData & {
  guid_id: string
  guid_vaga: string
}

export async function submitCandidateProfile(data: CandidateProfilePayload, cvFile?: File) {
  validateUserRegistrationData(data)
  if (!data.guid_id.trim() || !data.guid_vaga.trim()) {
    throw new Error("Não foi possível identificar a vaga ou a candidatura.")
  }

  let cv: { key: string; filename: string; contentType: string; size: number } | undefined
  if (cvFile) {
    const uploadResponse = await fetch('/api/candidates/cv-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: data.guid_id,
        filename: cvFile.name,
        contentType: cvFile.type,
        size: cvFile.size,
      }),
    })
    if (!uploadResponse.ok) throw new Error('Não foi possível preparar o envio do currículo.')

    const uploadPayload = await uploadResponse.json().catch(() => null) as {
      data?: { uploadUrl?: unknown; key?: unknown }
    } | null
    const upload = uploadPayload?.data
    if (typeof upload?.uploadUrl !== 'string' || typeof upload.key !== 'string' || !upload.key.trim()) {
      throw new Error('A API retornou dados inválidos para o envio do currículo.')
    }

    let uploadUrl: URL
    try {
      uploadUrl = new URL(upload.uploadUrl)
    } catch {
      throw new Error('A API retornou dados inválidos para o envio do currículo.')
    }
    if (uploadUrl.protocol !== 'https:' && uploadUrl.protocol !== 'http:') {
      throw new Error('A API retornou dados inválidos para o envio do currículo.')
    }

    const putResponse = await fetch(upload.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': cvFile.type },
      body: cvFile,
    })
    if (!putResponse.ok) throw new Error('Não foi possível enviar o currículo.')
    cv = { key: upload.key, filename: cvFile.name, contentType: cvFile.type, size: cvFile.size }
  }

  const payload = {
    ...data,
    industriaInteresse: areaValuesToNumbers(data.industriaInteresse),
    areaPreferencia: areaValuesToNumbers(data.areaPreferencia),
    ...(cv ? { cv } : {}),
  }

  const response = await fetch(CANDIDATES_API_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }
}
