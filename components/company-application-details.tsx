"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getCandidateCvDownloadUrl } from '@/services/cv-download-service'
import { hardcodedAreaOptions } from '@/services/areas-service'
import { CompanyPageShell } from '@/components/company-page-shell'

type RecordData = Record<string, unknown>
const groups: Array<{ title: string; fields: Array<[string, string]> }> = [
  { title: 'Dados pessoais', fields: [['nome', 'Nome'], ['documento', 'Documento'], ['dataNascimento', 'Data de nascimento'], ['localResidencia', 'CEP'], ['endereco', 'Endereço'], ['cidade', 'Cidade'], ['estado', 'Estado'], ['contatoCel', 'Celular'], ['contato', 'E-mail']] },
  { title: 'Dados profissionais', fields: [['empresaAtual', 'Empresa atual'], ['senioridade', 'Senioridade'], ['beneficiosAtuais', 'Benefícios atuais'], ['experiencia', 'Experiência'], ['salarioAtual', 'Salário atual'], ['setorAtual', 'Setor atual'], ['timeAtual', 'Time atual'], ['industriaInteresse', 'Áreas de interesse'], ['hardSkillsProfissionais', 'Hard skills profissionais'], ['softSkillsProfissionais', 'Soft skills profissionais']] },
  { title: 'Preferências', fields: [['tipoContratacao', 'Tipos de contratação'], ['modeloTrabalho', 'Modelos de trabalho'], ['setor', 'Setores'], ['time', 'Times'], ['senioridadePreferencia', 'Senioridades'], ['areaPreferencia', 'Áreas'], ['idiomas', 'Idiomas'], ['hardSkills', 'Hard skills'], ['softSkills', 'Soft skills'], ['viagemTrabalho', 'Viagem a trabalho'], ['sobreVoce', 'Sobre o candidato']] },
  { title: 'Nesta candidatura', fields: [['guid_vaga', 'Vaga'], ['pretensaoSalarial', 'Pretensão salarial'], ['mensagemEmpresa', 'Mensagem para a empresa'], ['status', 'Etapa atual'], ['anotacoes', 'Anotações da empresa'], ['compartilhamentoAccepted', 'Compartilhamento autorizado'], ['lgpdAcceptedAt', 'Aceite de privacidade'], ['createdAt', 'Enviada em'], ['profile_version', 'Versão do perfil enviado']] },
]

export function formatApplicationValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === '') return 'Não informado'
  if (Array.isArray(value)) return value.length ? value.map(item => formatApplicationValue(item, field)).join(', ') : 'Não informado'
  if (typeof value === 'object') {
    const item = value as RecordData
    if (typeof item.idioma === 'string') return `${item.idioma} (${item.fluencia || 'fluência não informada'})`
    return Object.values(item).map(entry => formatApplicationValue(entry)).join(' · ') || 'Não informado'
  }
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (field === 'industriaInteresse' || field === 'areaPreferencia') {
    const area = hardcodedAreaOptions.find(option => option.value === String(value))
    if (area) return area.label
  }
  return String(value).trim() || 'Não informado'
}

export function CompanyApplicationDetails({ id, accountLabel }: { id: string; accountLabel: string }) {
  const [record, setRecord] = useState<RecordData | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading')
  const [downloadError, setDownloadError] = useState('')
  useEffect(() => {
    let active = true
    fetch(`/api/candidates/${encodeURIComponent(id)}`, { cache: 'no-store' }).then(async response => {
      if (response.status === 404) { if (active) setState('missing'); return }
      if (!response.ok) throw new Error('lookup failed')
      const payload = await response.json() as { data?: RecordData }
      if (!payload.data) throw new Error('missing data')
      if (active) { setRecord(payload.data); setState('ready') }
    }).catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [id])

  const download = async () => {
    setDownloadError('')
    try { window.location.assign(await getCandidateCvDownloadUrl(id)) }
    catch { setDownloadError('Não foi possível baixar o CV. Tente novamente.') }
  }

  return <CompanyPageShell title="Detalhes da candidatura" description="Consulte os dados enviados pelo candidato nesta vaga." accountLabel={accountLabel}>
    <div className="bg-slate-50 px-5 py-8 text-slate-950">
    <div className="mx-auto max-w-5xl">
      <Link href="/empresa/candidaturas" className="font-medium text-orange-700">Voltar ao pipeline</Link>
      <h1 className="mt-8 text-3xl font-semibold">Detalhes da candidatura</h1>
      {state !== 'ready' ? <p role="status" className="mt-6 rounded-xl bg-white p-6">{state === 'loading' ? 'Carregando candidatura...' : state === 'missing' ? 'Candidatura não encontrada.' : 'Não foi possível carregar esta candidatura. Confira sua conta e tente novamente.'}</p> : null}
      {record ? <>
        <p className="mt-2 text-slate-600">Dados enviados por {formatApplicationValue(record.nome)} nesta candidatura. Edições futuras do perfil não alteram este histórico.</p>
        <div className="mt-7 grid gap-6">{groups.map(group => <section key={group.title} className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{group.title}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">{group.fields.map(([key, label]) => <div key={key}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm">{formatApplicationValue(record[key], key)}</dd></div>)}</dl>
        </section>)}</div>
        <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">Indicações</h2>
          {([...(Array.isArray(record.indicacoes) ? record.indicacoes : []), ...(record.indicacao ? [record.indicacao] : [])].length)
            ? <ul className="mt-4 space-y-3">{[...(Array.isArray(record.indicacoes) ? record.indicacoes : []), ...(record.indicacao ? [record.indicacao] : [])].map((item, index) => {
              const recommendation = item && typeof item === 'object' ? item as RecordData : {}
              return <li key={index} className="grid gap-2 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <p><strong>Nome:</strong> {formatApplicationValue(recommendation.nome)}</p>
                <p><strong>Telefone:</strong> {formatApplicationValue(recommendation.telefone)}</p>
                <p><strong>Cargo:</strong> {formatApplicationValue(recommendation.cargo)}</p>
              </li>
            })}</ul>
            : <p className="mt-3 text-slate-600">Nenhuma indicação informada.</p>}</section>
        <section className="mt-6 rounded-2xl border bg-white p-6"><h2 className="text-xl font-semibold">CV enviado</h2>
          {record.cv && typeof record.cv === 'object' ? <><p className="mt-3">{formatApplicationValue((record.cv as RecordData).filename)}</p><button type="button" onClick={download} className="mt-3 rounded-full bg-orange-600 px-5 py-3 font-semibold text-white">Baixar CV</button></> : <p className="mt-3 text-slate-600">Nenhum CV enviado nesta candidatura.</p>}
          {downloadError ? <p role="alert" className="mt-2 text-red-700">{downloadError}</p> : null}</section>
      </> : null}
    </div>
    </div>
  </CompanyPageShell>
}
