const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CODE = /^[A-Za-z0-9_-]{22}$/

export function sharedJobPath(guid: string, title: string): string | null {
  if (!UUID.test(guid)) return null
  const hex = guid.replaceAll('-', '')
  const bytes = hex.match(/.{2}/g)!.map((byte) => String.fromCharCode(parseInt(byte, 16))).join('')
  const code = btoa(bytes).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  const slug = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vaga'
  return `/jobs/${slug}-${code}`
}

export function guidFromSharedJobCode(value: string): string | null {
  const code = value.slice(-22)
  if (value.length < 24 || value.at(-23) !== '-' || !CODE.test(code)) return null
  try {
    const binary = atob(code.replaceAll('-', '+').replaceAll('_', '/') + '==')
    if (binary.length !== 16) return null
    const hex = [...binary].map((byte) => byte.charCodeAt(0).toString(16).padStart(2, '0')).join('')
    const guid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    return sharedJobPath(guid, 'vaga')?.endsWith(code) ? guid : null
  } catch {
    return null
  }
}
