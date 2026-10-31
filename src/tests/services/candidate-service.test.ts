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
    indicacao: { nome: 'Ana Souza', telefone: '11988887777', cargo: 'Gerente de Produto' },
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
  const cvFile = { name: 'cv-e2e.pdf', type: 'application/pdf', size: 12 } as File
  const uploadUrl = 'https://clusterjobs.s3.us-east-1.amazonaws.com/cvs/candidate/candidate-1.pdf?signature=synthetic'
  const uploadKey = 'cvs/candidate/candidate-1.pdf'

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

  it('uploads a CV using the API response data and includes its metadata in the candidature', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { uploadUrl, key: uploadKey } }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await submitCandidateProfile(createPayload(), cvFile)

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/candidates/cv-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'candidate-1', filename: cvFile.name, contentType: cvFile.type, size: cvFile.size }),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': cvFile.type },
      body: cvFile,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/candidates', expect.objectContaining({
      method: 'POST',
      body: expect.any(String),
    }))
    const candidaturePayload = JSON.parse(fetchMock.mock.calls[2][1].body)
    expect(candidaturePayload.cv).toEqual({
      key: uploadKey,
      filename: cvFile.name,
      contentType: cvFile.type,
      size: cvFile.size,
    })
  })

  it('stops when the CV signing request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitCandidateProfile(createPayload(), cvFile))
      .rejects.toThrow('Não foi possível preparar o envio do currículo.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('rejects a malformed CV signing response before uploading', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ uploadUrl, key: uploadKey }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitCandidateProfile(createPayload(), cvFile))
      .rejects.toThrow('A API retornou dados inválidos para o envio do currículo.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not submit a candidature when the S3 PUT fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { uploadUrl, key: uploadKey } }) })
      .mockResolvedValueOnce({ ok: false, status: 403 })
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitCandidateProfile(createPayload(), cvFile))
      .rejects.toThrow('Não foi possível enviar o currículo.')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('reports a candidature API error after a successful CV upload', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { uploadUrl, key: uploadKey } }) })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 422, statusText: 'Unprocessable', text: async () => 'invalid candidature' })
    vi.stubGlobal('fetch', fetchMock)

    await expect(submitCandidateProfile(createPayload(), cvFile))
      .rejects.toThrow('API request failed (422): invalid candidature')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
