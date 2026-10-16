import { describe, expect, it, vi } from 'vitest'

import { submitCandidateProfile, type CandidateProfilePayload } from '@/services/candidate-service'
import type { UserRegistrationData } from '@/services/user-registration-service'

function createPayload(overrides: Partial<CandidateProfilePayload> = {}): CandidateProfilePayload {
  const registration: UserRegistrationData = {
    nome: 'Mariana Costa',
    documento: '12345678909',
    dataNascimento: '1992-04-15',
    localResidencia: '01310930',
    endereco: 'Avenida Paulista, 1000',
    cidade: 'Sao Paulo',
    estado: 'SP',
    contatoCel: '11999999999',
    contato: 'mariana@clusterhr.com',
    lgpdAccepted: true,
    empresaAtual: 'ClusterHR',
    senioridade: 'senior',
    beneficiosAtuais: ['vale-refeicao'],
    experiencia: '3-5-anos',
    salarioAtual: '8.000',
    setorAtual: 'tecnologia-informacao-ti',
    timeAtual: ['DevOps'],
    industriaInteresse: ['3'],
    hardSkillsProfissionais: ['javascript'],
    softSkillsProfissionais: ['colaboracao'],
    tipoContratacao: ['clt'],
    modeloTrabalho: ['remoto'],
    setor: ['tecnologia-informacao-ti'],
    time: ['DevOps'],
    senioridadePreferencia: ['senior'],
    areaPreferencia: ['3'],
    idiomas: [],
    hardSkills: ['javascript'],
    softSkills: ['colaboracao'],
    viagemTrabalho: 'sim',
    pretensaoSalarial: '12.000',
    sobreVoce: 'Profissional com experiencia em tecnologia.',
    mensagemEmpresa: '',
    compartilhamentoAccepted: true,
  }

  return {
    ...registration,
    guid_id: 'candidate-1',
    guid_vaga: 'job-1',
    ...overrides,
  }
}

describe('submitCandidateProfile', () => {
  it('posts the complete application and converts selected area IDs to numbers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const payload = createPayload()
    await submitCandidateProfile(payload)

    expect(fetchMock).toHaveBeenCalledWith('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, industriaInteresse: [3], areaPreferencia: [3] }),
    })
  })

  it('rejects invalid registration data before sending the request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitCandidateProfile(createPayload({ contato: 'email-invalido' })))
      .rejects.toThrow('Digite um e-mail valido.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects missing vacancy identifiers before sending the request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitCandidateProfile(createPayload({ guid_vaga: ' ' })))
      .rejects.toThrow('Não foi possível identificar a vaga ou a candidatura.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('propagates upstream errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 422, statusText: 'Unprocessable', text: async () => 'invalid payload' }),
    )

    await expect(submitCandidateProfile(createPayload())).rejects.toThrow('API request failed (422): invalid payload')
  })
})
