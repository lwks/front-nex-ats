"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleAlert } from "lucide-react"

import { ProgressIndicator } from "@/components/progress-indicator"
import { UserRegistrationCvStep } from "@/components/steps/user-registration-cv-step"
import { UserRegistrationPersonalStep } from "@/components/steps/user-registration-personal-step"
import { UserRegistrationPreferencesStep } from "@/components/steps/user-registration-preferences-step"
import { UserRegistrationProfessionalStep } from "@/components/steps/user-registration-professional-step"
import { Button } from "@/components/ui/button"
import { submitCandidateProfile } from "@/services/candidate-service"
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

export function CandidateOnboarding({ jobGuid }: { jobGuid: string }) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [visitedSteps, setVisitedSteps] = useState<number[]>([1])
  const [candidateData, setCandidateData] = useState<Partial<UserRegistrationData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<SubmissionFeedback | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvError, setCvError] = useState<string | null>(null)

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
    if (cvFile && cvFile.size > 5 * 1024 * 1024) {
      setCvError("O arquivo excede o limite de 5 MB.")
      return
    }
    setIsSubmitting(true)

    try {
      await submitCandidateProfile({
        ...candidateData,
        guid_id: crypto.randomUUID(),
        guid_vaga: jobGuid,
      } as UserRegistrationData & { guid_id: string; guid_vaga: string }, cvFile ?? undefined)
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
          ? error.message
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
        {currentStep === 4 ? (
          <UserRegistrationCvStep isSubmitting={isSubmitting} onSubmit={handleSubmit} onBack={prevStep} file={cvFile} onFileChange={(file) => { setCvError(null); if (file && file.size > 5 * 1024 * 1024) { setCvFile(null); setCvError("O arquivo excede o limite de 5 MB."); return } if (file && !/\.(pdf|docx?)$/i.test(file.name)) { setCvFile(null); setCvError("Formato inválido. Envie PDF, DOCX ou DOC."); return } setCvFile(file) }} error={cvError} />
        ) : null}
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
