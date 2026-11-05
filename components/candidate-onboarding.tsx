"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleAlert } from "lucide-react"

import { ProgressIndicator } from "@/components/progress-indicator"
import { UserRegistrationCvStep } from "@/components/steps/user-registration-cv-step"
import { UserRegistrationPersonalStep } from "@/components/steps/user-registration-personal-step"
import { UserRegistrationPreferencesStep } from "@/components/steps/user-registration-preferences-step"
import { UserRegistrationProfessionalStep } from "@/components/steps/user-registration-professional-step"
import { Button } from "@/components/ui/button"
import { getOwnApplication, getSavedProfile, profileFromForm, sendApplication, uploadProfileCv, type CvAction, type SavedProfile } from "@/services/candidate-application-service"
import type { UserRegistrationData } from "@/services/user-registration-service"

type SubmissionFeedback = {
  type: "success" | "error"
  title: string
  message: string
}

const CANDIDATURE_STEPS = [
  { number: 1, label: "Dados pessoais" },
  { number: 2, label: "Experiência Profissional" },
  { number: 3, label: "Preferências" },
  { number: 4, label: "CV" },
]

function requiresLgpdRenewal(profile: SavedProfile | null) {
  if (!profile) return true
  const acceptedAt = Date.parse(profile.lgpdAcceptedAt || '')
  return profile.lgpdRenewalRequired || !Number.isFinite(acceptedAt) || Date.now() - acceptedAt >= 21 * 24 * 60 * 60 * 1000
}

export function CandidateOnboarding({ jobGuid }: { jobGuid: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [visitedSteps, setVisitedSteps] = useState<number[]>([1])
  const [candidateData, setCandidateData] = useState<Partial<UserRegistrationData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<SubmissionFeedback | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)
  const [jobAvailability, setJobAvailability] = useState<"loading" | "open" | "closed" | "not-found" | "error">("loading")
  const [profile, setProfile] = useState<SavedProfile | null>(null)
  const [profileState, setProfileState] = useState<'loading' | 'ready' | 'existing' | 'error'>('loading')
  const [choice, setChoice] = useState<'USE_SAVED_PROFILE' | 'UPDATE_PROFILE' | null>(null)
  const [review, setReview] = useState(false)
  const [cvAction, setCvAction] = useState<CvAction>('KEEP')
  const [salary, setSalary] = useState('')
  const [message, setMessage] = useState('')
  const [sharing, setSharing] = useState(false)
  const [lgpdRenewal, setLgpdRenewal] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/jobs/${encodeURIComponent(jobGuid)}`, { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 404) { if (active) setJobAvailability("not-found"); return }
        if (!response.ok) throw new Error("job lookup failed")
        const payload = await response.json() as { data?: { status?: string } }
        if (active) setJobAvailability(payload.data?.status === "Encerrada" ? "closed" : "open")
      })
      .catch(() => { if (active) setJobAvailability("error") })
    return () => { active = false }
  }, [jobGuid])

  useEffect(() => {
    let active = true
    Promise.all([getSavedProfile(), getOwnApplication(jobGuid)]).then(([saved, existing]) => {
      if (!active) return
      if (existing) { setProfileState('existing'); return }
      setProfile(saved)
      setProfileState('ready')
      if (!saved) setChoice('UPDATE_PROFILE')
    }).catch(() => { if (active) setProfileState('error') })
    return () => { active = false }
  }, [jobGuid])

  const chooseReview = () => {
    if (profile) setCandidateData({ ...profile,
      industriaInteresse: profile.industriaInteresse?.map(String),
      areaPreferencia: profile.areaPreferencia?.map(String),
      lgpdAccepted: !profile.lgpdRenewalRequired,
      compartilhamentoAccepted: false, pretensaoSalarial: '', mensagemEmpresa: '' })
    setChoice('UPDATE_PROFILE')
    setCurrentStep(1)
  }

  const updateData = (data: Partial<UserRegistrationData>) => {
    setCandidateData((previous) => ({ ...previous, ...data }))
  }

  const nextStep = () => {
    setCurrentStep((current) => {
      const next = Math.min(current + 1, CANDIDATURE_STEPS.length)
      setVisitedSteps((previous) => previous.includes(next) ? previous : [...previous, next])
      return next
    })
  }

  const prevStep = () => setCurrentStep((current) => Math.max(current - 1, 1))

  const handleStepClick = (stepNumber: number) => {
    if (visitedSteps.includes(stepNumber)) setCurrentStep(stepNumber)
  }

  const handleSubmit = async () => {
    if (profile && requiresLgpdRenewal(profile) && !lgpdRenewal) {
      setFeedbackModal({ type: 'error', title: 'Confirme os termos de privacidade',
        message: 'Seu aceite precisa ser renovado antes de enviar a candidatura.' })
      return
    }
    if (cvFile && cvFile.size > 5 * 1024 * 1024) {
      setCvError("O arquivo excede o limite de 5 MB.")
      return
    }
    setIsSubmitting(true)

    try {
      const cv = cvFile ? await uploadProfileCv(cvFile) : undefined
      await sendApplication({ guid_vaga: jobGuid, mode: choice || 'UPDATE_PROFILE',
        ...(profile ? { profileVersion: profile.version } : {}),
        ...(choice === 'UPDATE_PROFILE' ? { profile: profileFromForm(candidateData) } : {}),
        application: {
          mensagemEmpresa: choice === 'USE_SAVED_PROFILE' ? message : candidateData.mensagemEmpresa || '',
          pretensaoSalarial: choice === 'USE_SAVED_PROFILE' ? salary : candidateData.pretensaoSalarial || '',
          compartilhamentoAccepted: choice === 'USE_SAVED_PROFILE' ? sharing : candidateData.compartilhamentoAccepted === true,
          lgpdAccepted: profile ? lgpdRenewal : candidateData.lgpdAccepted === true,
          cvAction: cvFile ? 'REPLACE' : cvAction, ...(cv ? { cv } : {}),
        } })
      setFeedbackModal({
        type: "success",
        title: "Candidatura enviada com sucesso!",
        message: "Recebemos seus dados e em breve a empresa poderá avaliar seu perfil.",
      })
    } catch (error) {
      console.error("Failed to submit candidate application", error)
      setFeedbackModal({
        type: "error",
        title: "Não foi possível enviar sua candidatura",
        message: error instanceof Error
          ? "Revise os dados do seu perfil e tente novamente. Se o problema continuar, tente mais tarde."
          : "Não foi possível enviar seus dados. Tente novamente em instantes.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeFeedbackModal = () => {
    const wasSuccessful = feedbackModal?.type === "success"
    setFeedbackModal(null)
    if (wasSuccessful) router.push("/jobs/list")
  }

  if (jobAvailability !== "open" || profileState !== 'ready') {
    return <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold text-slate-950">{jobAvailability === 'closed' ? 'Vaga encerrada' : jobAvailability === 'not-found' ? 'Vaga n\u00e3o encontrada' : profileState === 'existing' ? 'Voc\u00ea j\u00e1 se candidatou a esta vaga' : jobAvailability === 'error' || profileState === 'error' ? 'N\u00e3o foi poss\u00edvel carregar a candidatura' : 'Carregando candidatura...'}</h1>
      <p className="text-slate-600">{jobAvailability === "closed" ? "Esta vaga n\u00e3o est\u00e1 mais recebendo candidaturas." : jobAvailability === "not-found" ? "Esta vaga n\u00e3o est\u00e1 dispon\u00edvel. Volte \u00e0 lista para escolher outra oportunidade." : profileState === 'existing' ? "Seu cadastro para esta vaga j\u00e1 foi recebido." : jobAvailability === "error" || profileState === 'error' ? "Ocorreu uma falha ao consultar os dados. Volte \u00e0 lista de vagas e tente novamente." : "Aguarde enquanto confirmamos se a vaga est\u00e1 aberta."}</p>
      <Link href="/jobs/list" className="rounded-full bg-[#FF6B00] px-5 py-3 font-semibold text-white">Voltar para vagas</Link>
    </main>
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fff8f1_0%,_#ffffff_20%,_#f8fafc_100%)]">
      <header className="border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/jobs/list" className="text-sm font-medium text-slate-600 transition hover:text-[#FF6B00]">
            Voltar às vagas
          </Link>
          <div className="rounded-full border border-[#FF6B00]/15 bg-[#FF6B00]/8 px-4 py-2 text-sm font-medium text-[#C44E00]">
            Candidatura
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <section className="rounded-[2rem] border border-black/5 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">ClusterHR</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Candidate-se à vaga</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Preencha seus dados pessoais, profissionais e preferências para enviar seu perfil à empresa.
          </p>
        </section>

        {profile && !choice ? <section className="rounded-[2rem] border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">Seu perfil salvo</h2>
          <p className="mt-2">{profile.nome} · {profile.contato}</p>
          <p className="mt-2">{profile.experiencia} · {profile.cv?.filename || 'Sem CV salvo'}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setChoice('USE_SAVED_PROFILE')}>Usar informações salvas</Button>
            <Button variant="outline" onClick={chooseReview}>Revisar e alterar</Button>
          </div>
        </section> : null}
        {choice === 'USE_SAVED_PROFILE' ? <section className="space-y-5 rounded-[2rem] border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">Revise esta candidatura</h2>
          <label className="block">Pretensão salarial da vaga<input className="mt-1 w-full rounded border p-2" value={salary} onChange={event => setSalary(event.target.value)} /></label>
          <label className="block">Mensagem para a empresa<textarea className="mt-1 w-full rounded border p-2" value={message} onChange={event => setMessage(event.target.value)} /></label>
          <label className="block">Currículo<select className="mt-1 w-full rounded border p-2" value={cvAction} onChange={event => setCvAction(event.target.value as CvAction)}>
            <option value="KEEP">Manter CV do perfil</option><option value="REMOVE">Enviar sem CV</option>
          </select></label>
          <label className="block">Substituir CV<input type="file" accept=".pdf,.doc,.docx" onChange={event => setCvFile(event.target.files?.[0] || null)} /></label>
          {requiresLgpdRenewal(profile) ? <label className="flex gap-2"><input type="checkbox" checked={lgpdRenewal} onChange={event => setLgpdRenewal(event.target.checked)} />Aceito novamente os termos de privacidade.</label> : null}
          <label className="flex gap-2"><input type="checkbox" checked={sharing} onChange={event => setSharing(event.target.checked)} />Confirmo o compartilhamento dos meus dados para esta candidatura.</label>
          <Button disabled={isSubmitting || !salary.trim() || !sharing || (requiresLgpdRenewal(profile) && !lgpdRenewal)} onClick={handleSubmit}>{isSubmitting ? 'Enviando...' : 'Enviar candidatura'}</Button>
        </section> : null}
        {choice === 'UPDATE_PROFILE' && review ? <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-8">
          <h2 className="text-2xl font-semibold">Revisão final</h2>
          <p>{candidateData.nome} · {candidateData.contato}</p><p>Pretensão salarial: {candidateData.pretensaoSalarial}</p>
          <p>CV: {cvAction === 'REMOVE' && !cvFile ? 'Sem CV nesta candidatura' : cvFile?.name || profile?.cv?.filename || 'Sem CV'}</p>
          <p>Compartilhamento confirmado: {candidateData.compartilhamentoAccepted ? 'Sim' : 'Não'}</p>
          {profile && requiresLgpdRenewal(profile) ? <label className="flex gap-2"><input type="checkbox" checked={lgpdRenewal} onChange={event => setLgpdRenewal(event.target.checked)} />Aceito novamente os termos de privacidade.</label> : null}
          <Button variant="outline" onClick={() => setReview(false)}>Voltar e alterar</Button>
          <Button disabled={isSubmitting} onClick={handleSubmit}>{isSubmitting ? 'Enviando...' : 'Confirmar candidatura'}</Button>
        </section> : null}
        {choice === 'UPDATE_PROFILE' && !review ? <>
        <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:px-8">
          <ProgressIndicator
            currentStep={currentStep}
            totalSteps={CANDIDATURE_STEPS.length}
            onStepClick={handleStepClick}
            steps={CANDIDATURE_STEPS}
            visitedSteps={visitedSteps}
          />
        </section>

        {currentStep === 1 ? (
          <UserRegistrationPersonalStep data={candidateData} onUpdate={updateData} onNext={nextStep} />
        ) : null}
        {currentStep === 2 ? (
          <UserRegistrationProfessionalStep data={candidateData} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />
        ) : null}
        {currentStep === 3 ? (
          <UserRegistrationPreferencesStep data={candidateData} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />
        ) : null}
        {currentStep === 4 ? (<>
          {profile?.cv ? <label className="block rounded-lg bg-white p-4">CV salvo: {profile.cv.filename}<select className="ml-3 rounded border p-2" value={cvAction} onChange={event => setCvAction(event.target.value as CvAction)}><option value="KEEP">Manter</option><option value="REMOVE">Enviar sem CV</option></select></label> : null}
          <UserRegistrationCvStep isSubmitting={isSubmitting} onSubmit={() => setReview(true)} onBack={prevStep} file={cvFile} onFileChange={(file) => { setCvError(null); if (file && file.size > 5 * 1024 * 1024) { setCvFile(null); setCvError("O arquivo excede o limite de 5 MB."); return } if (file && !/\.(pdf|docx?)$/i.test(file.name)) { setCvFile(null); setCvError("Formato inválido. Envie PDF, DOCX ou DOC."); return } setCvFile(file) }} error={cvError} />
        </>) : null}
        </> : null}
      </main>

      {feedbackModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[1.5rem] bg-white p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.24)]">
            {feedbackModal.type === "success" ? (
              <CheckCircle2 className="mx-auto mb-4 size-12 text-emerald-500" aria-hidden="true" />
            ) : (
              <CircleAlert className="mx-auto mb-4 size-12 text-destructive" aria-hidden="true" />
            )}
            <h2 className="text-xl font-semibold text-slate-950">{feedbackModal.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feedbackModal.message}</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={closeFeedbackModal} size="lg" className="min-w-[180px] rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]">
                {feedbackModal.type === "success" ? "Voltar às vagas" : "Tentar novamente"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
