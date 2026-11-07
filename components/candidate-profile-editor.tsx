"use client"

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { UserRegistrationPersonalStep } from '@/components/steps/user-registration-personal-step'
import { UserRegistrationProfessionalStep } from '@/components/steps/user-registration-professional-step'
import { UserRegistrationPreferencesStep } from '@/components/steps/user-registration-preferences-step'
import { getOwnProfileCvDownloadUrl, getSavedProfile, profileFromForm, saveCandidateProfile, uploadProfileCv, type CvAction, type SavedProfile } from '@/services/candidate-application-service'
import type { UserRegistrationData } from '@/services/user-registration-service'

const steps = ['Dados pessoais', 'Dados profissionais e indicações', 'Preferências', 'CV']
const textFields = new Set(['nome', 'documento', 'dataNascimento', 'localResidencia', 'endereco', 'cidade', 'estado',
  'contatoCel', 'contato', 'empresaAtual', 'salarioAtual', 'sobreVoce'])

function formFromProfile(profile: SavedProfile): Partial<UserRegistrationData> {
  return { ...profile, industriaInteresse: profile.industriaInteresse?.map(String),
    areaPreferencia: profile.areaPreferencia?.map(String), lgpdAccepted: !profile.lgpdRenewalRequired }
}

export function CandidateProfileEditor() {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [profile, setProfile] = useState<SavedProfile | null>(null)
  const [data, setData] = useState<Partial<UserRegistrationData>>({})
  const [initialData, setInitialData] = useState('{}')
  const [pending, setPending] = useState(false)
  const [step, setStep] = useState(0)
  const [cvAction, setCvAction] = useState<CvAction>('KEEP')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const typedFields = useRef<Partial<UserRegistrationData>>({})
  const dirty = pending || JSON.stringify(data) !== initialData || cvAction !== 'KEEP' || Boolean(file)

  useEffect(() => {
    let active = true
    getSavedProfile().then(saved => {
      if (!active) return
      const form = saved ? formFromProfile(saved) : {}
      typedFields.current = {}
      setProfile(saved); setData(form); setInitialData(JSON.stringify(form)); setState('ready')
    }).catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!dirty) return
    const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty])

  const update = (patch: Partial<UserRegistrationData>) => {
    setData(previous => ({ ...previous, ...patch, ...typedFields.current }))
    setFeedback(''); setError('')
  }
  const next = () => setStep(previous => Math.min(previous + 1, 3))
  const back = () => setStep(previous => Math.max(previous - 1, 0))

  const save = async () => {
    setError(''); setFeedback('')
    if (!data.lgpdAccepted && (!profile || profile.lgpdRenewalRequired)) {
      setError('Confirme os termos de privacidade na seção Dados pessoais.'); return
    }
    setSaving(true)
    try {
      const cv = file ? await uploadProfileCv(file) : undefined
      const saved = await saveCandidateProfile({ ...(profile ? { version: profile.version } : {}),
        profile: profileFromForm(data), lgpdAccepted: !profile || profile.lgpdRenewalRequired ? data.lgpdAccepted === true : false,
        cvAction: cv ? 'REPLACE' : cvAction, ...(cv ? { cv } : {}) })
      const form = formFromProfile(saved)
      typedFields.current = {}
      setProfile(saved); setData(form); setInitialData(JSON.stringify(form)); setFile(null); setCvAction('KEEP'); setPending(false)
      setFeedback('Perfil salvo com sucesso. Suas candidaturas anteriores continuam com os dados enviados na época.')
    } catch (cause) {
      setError(cause instanceof Error && cause.message.includes('Recarregue')
        ? 'O perfil foi alterado em outra sessão. Recarregue a página para revisar a versão atual.'
        : 'Não foi possível salvar o perfil. Confira os campos e o CV e tente novamente.')
    } finally { setSaving(false) }
  }

  const viewCv = async () => {
    setError('')
    try { window.location.assign(await getOwnProfileCvDownloadUrl()) }
    catch { setError('Não foi possível abrir o CV salvo. Tente novamente.') }
  }

  if (state !== 'ready') return <main className="mx-auto max-w-3xl p-8 text-center">
    <h1 className="text-2xl font-semibold">{state === 'loading' ? 'Carregando seu perfil...' : 'Não foi possível carregar seu perfil'}</h1>
    {state === 'error' ? <p className="mt-3 text-slate-600">Recarregue a página e tente novamente.</p> : null}
  </main>

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
      <Link href="/jobs/list" className="font-medium text-slate-600 hover:text-orange-600">Voltar às vagas</Link>
      <div className="flex items-center gap-4"><span className="font-semibold">Meu perfil</span><a href="/api/auth/logout" className="text-sm text-slate-600">Sair</a></div>
    </div></header>
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-8" onInput={event => {
      setPending(true)
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        if (textFields.has(target.id)) {
          typedFields.current = { ...typedFields.current, [target.id]: target.value }
        }
      }
    }} onChange={() => setPending(true)}>
      <div><h1 className="text-3xl font-semibold">Meu perfil</h1><p className="mt-2 text-slate-600">Edite seus dados para usar em futuras candidaturas.</p></div>
      <nav aria-label="Seções do perfil" className="flex flex-wrap gap-2">{steps.map((label, index) =>
        <span key={label} aria-current={step === index ? 'step' : undefined} className={`rounded-full px-4 py-2 text-sm ${step === index ? 'bg-orange-600 text-white' : 'bg-white text-slate-600'}`}>{index + 1}. {label}</span>)}</nav>
      {step === 0 ? <UserRegistrationPersonalStep data={data} onUpdate={update} onNext={next} /> : null}
      {step === 1 ? <UserRegistrationProfessionalStep data={data} onUpdate={update} onNext={next} onBack={back} /> : null}
      {step === 2 ? <UserRegistrationPreferencesStep data={data} onUpdate={update} onNext={next} onBack={back} profileMode /> : null}
      {step === 3 ? <section className="rounded-3xl border bg-white p-6 shadow-sm md:p-8">
        <h2 className="text-2xl font-semibold">Currículo</h2>
        <p className="mt-2 text-slate-600">O CV é opcional. Escolha o que ficará salvo no seu perfil.</p>
        {profile?.cv ? <div className="mt-5 rounded-xl bg-slate-50 p-4"><p>CV salvo: {profile.cv.filename}</p>
          <button type="button" onClick={viewCv} className="mt-2 text-sm font-semibold text-orange-700 underline">Baixar CV salvo</button></div> : <p className="mt-5 text-slate-500">Nenhum CV salvo.</p>}
        {profile?.cv ? <label className="mt-5 block">Ação para o CV salvo
          <select className="mt-2 block w-full rounded-lg border p-3" value={cvAction} onChange={event => { setCvAction(event.target.value as CvAction); setFeedback('') }}>
            <option value="KEEP">Manter CV</option><option value="REMOVE">Remover CV do perfil</option>
          </select></label> : null}
        <label className="mt-5 block">Substituir ou adicionar CV (PDF, DOC ou DOCX, até 5 MB)
          <input className="mt-2 block w-full rounded-lg border p-3" type="file" accept=".pdf,.doc,.docx" onChange={event => { setFile(event.target.files?.[0] || null); setCvAction('KEEP'); setFeedback('') }} /></label>
        {file ? <button type="button" className="mt-2 text-sm underline" onClick={() => setFile(null)}>Remover seleção: {file.name}</button> : null}
        <div className="mt-8 flex justify-between gap-4"><button type="button" onClick={back} className="rounded-full border px-5 py-3">Voltar</button>
          <button type="button" onClick={save} disabled={saving || !dirty} className="rounded-full bg-orange-600 px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar perfil'}</button></div>
      </section> : null}
      {dirty ? <p className="text-sm text-amber-700">Você tem alterações não salvas.</p> : null}
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p> : null}
      {feedback ? <p role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-700">{feedback}</p> : null}
    </main>
  </div>
}
