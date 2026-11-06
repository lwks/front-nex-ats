import { areaValuesToNumbers } from '@/services/areas-service'
import type { UserRegistrationData } from '@/services/user-registration-service'

export type SavedProfile = Omit<UserRegistrationData, 'pretensaoSalarial' | 'mensagemEmpresa' | 'compartilhamentoAccepted'> & {
  version: number
  lgpdAcceptedAt?: string
  lgpdRenewalRequired: boolean
  cv?: { key: string; filename: string; contentType: string; size: number } | null
}
export type CvAction = 'KEEP' | 'REPLACE' | 'REMOVE'
export type ApplicationData = { mensagemEmpresa: string; pretensaoSalarial: string; compartilhamentoAccepted: boolean;
  lgpdAccepted?: boolean; cvAction: CvAction; cv?: SavedProfile['cv'] }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init })
  const payload = await response.json().catch(() => null) as { data?: T; message?: string } | null
  if (!response.ok) {
    if (response.status === 409) throw new Error('Seu perfil, a vaga ou a candidatura mudou. Recarregue a página e tente novamente.')
    if (response.status === 401 || response.status === 403) throw new Error('Entre como candidato para continuar.')
    throw new Error(payload?.message || 'Não foi possível carregar ou enviar a candidatura.')
  }
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, 'data')) throw new Error('A API retornou uma resposta inválida.')
  return payload?.data as T
}

export function getSavedProfile() { return request<SavedProfile | null>('/api/candidates/me/profile') }
export function saveCandidateProfile(body: { version?: number; profile: ReturnType<typeof profileFromForm>;
  lgpdAccepted: boolean; cvAction: CvAction; cv?: SavedProfile['cv'] }) {
  return request<SavedProfile>('/api/candidates/me/profile', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}
export function getOwnProfileCvDownloadUrl() {
  return request<{ downloadUrl: string }>('/api/candidates/me/cv-download').then(result => {
    const url = new URL(result.downloadUrl)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('A API retornou um link de CV inválido.')
    return result.downloadUrl
  })
}
export function getOwnApplication(jobGuid: string) {
  return request<{ guid_id: string } | null>(`/api/candidates/me/applications?guid_vaga=${encodeURIComponent(jobGuid)}`)
}
export function profileFromForm(data: Partial<UserRegistrationData>) {
  const { lgpdAccepted: _lgpd, compartilhamentoAccepted: _sharing,
    pretensaoSalarial: _salary, mensagemEmpresa: _message, ...profile } = data
  void _lgpd; void _sharing; void _salary; void _message
  return { ...profile,
    industriaInteresse: areaValuesToNumbers(data.industriaInteresse || []),
    areaPreferencia: areaValuesToNumbers(data.areaPreferencia || []) }
}
export async function uploadProfileCv(file: File) {
  const contentTypes: Record<string, string> = { pdf: 'application/pdf', doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  if (!contentTypes[extension] || file.type !== contentTypes[extension]) throw new Error('Formato inválido. Envie PDF, DOC ou DOCX.')
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('O currículo deve ter no máximo 5 MB.')
  const upload = await request<{ uploadUrl: string; key: string }>('/api/candidates/me/cv-upload', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
  })
  const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type, 'If-None-Match': '*' }, body: file })
  if (!response.ok) throw new Error('Não foi possível enviar o currículo.')
  return { key: upload.key, filename: file.name, contentType: file.type, size: file.size }
}
export function sendApplication(body: { guid_vaga: string; mode: 'USE_SAVED_PROFILE' | 'UPDATE_PROFILE'; profileVersion?: number;
  profile?: ReturnType<typeof profileFromForm>; application: ApplicationData }) {
  return request<{ guid_id: string }>('/api/candidates/applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}
