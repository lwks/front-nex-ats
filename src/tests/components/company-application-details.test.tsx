import { describe, expect, it } from 'vitest'
import { formatApplicationValue } from '@/components/company-application-details'

describe('application details', () => {
  it('formats optional data and recommendations clearly', () => {
    expect(formatApplicationValue([])).toBe('Não informado')
    expect(formatApplicationValue(null)).toBe('Não informado')
    expect(formatApplicationValue([{ idioma: 'Inglês', fluencia: 'Fluente' }])).toBe('Inglês (Fluente)')
    expect(formatApplicationValue([3], 'areaPreferencia')).toContain('Tecnologia')
    expect(formatApplicationValue({ nome: 'Maria', telefone: '11999999999', cargo: 'Gestora' })).toContain('Maria')
  })
})
