import { describe, expect, it } from 'vitest'
import { guidFromSharedJobCode, sharedJobPath } from '@/lib/job-share'

describe('short shared job URLs', () => {
  it('round trips a code containing a hyphen', () => {
    const guid = 'fb000000-0000-0000-0000-000000000000'
    const path = sharedJobPath(guid, 'Engenheiro de Software')
    expect(path).toMatch(/^\/jobs\/engenheiro-de-software--/)
    expect(guidFromSharedJobCode(path!.split('/').at(-1)!)).toBe(guid)
  })

  it('uses a stable slug and rejects malformed codes', () => {
    const path = sharedJobPath('11111111-1111-4111-8111-111111111111', 'Ação & Gestão')!
    expect(path).toMatch(/^\/jobs\/acao-gestao-/)
    expect(guidFromSharedJobCode(path.split('/').at(-1)!)).toBe('11111111-1111-4111-8111-111111111111')
    expect(guidFromSharedJobCode('vaga-short')).toBeNull()
    expect(guidFromSharedJobCode(`${path.split('/').at(-1)!.slice(0, -1)}!`)).toBeNull()
    expect(guidFromSharedJobCode(`${path.split('/').at(-1)!.slice(0, -1)}B`)).toBeNull()
    expect(sharedJobPath('invalid', 'Vaga')).toBeNull()
  })
})
