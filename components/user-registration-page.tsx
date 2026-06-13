"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, CheckCircle2, CircleAlert, UserRoundPlus } from "lucide-react"

import { ProgressIndicator } from "@/components/progress-indicator"
import { UserRegistrationPersonalStep } from "@/components/steps/user-registration-personal-step"
import { UserRegistrationPreferencesStep } from "@/components/steps/user-registration-preferences-step"
import { UserRegistrationProfessionalStep } from "@/components/steps/user-registration-professional-step"
import { Button } from "@/components/ui/button"
import { submitUserRegistration, type UserRegistrationData } from "@/services/user-registration-service"

type SubmissionFeedback = {
  type: "success" | "error"
  title: string
  message: string
}

const REGISTRATION_STEPS = [
  { number: 1, label: "Dados pessoais" },
  { number: 2, label: "Dados profissionais" },
  { number: 3, label: "Preferencias" },
]

export function UserRegistrationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [registrationData, setRegistrationData] = useState<Partial<UserRegistrationData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<SubmissionFeedback | null>(null)

  const updateData = (data: Partial<UserRegistrationData>) => {
    setRegistrationData((previous) => ({ ...previous, ...data }))
  }

  const nextStep = () => {
    setCurrentStep((current) => Math.min(current + 1, REGISTRATION_STEPS.length))
  }

  const prevStep = () => {
    setCurrentStep((current) => Math.max(current - 1, 1))
  }

  const handleSubmit = async (finalStepData?: Partial<UserRegistrationData>) => {
    const mergedData: Partial<UserRegistrationData> = {
      ...registrationData,
      ...(finalStepData ?? {}),
    }

    setIsSubmitting(true)

    try {
      await submitUserRegistration(mergedData as UserRegistrationData)
      setFeedbackModal({
        type: "success",
        title: "Cadastro concluido com sucesso",
        message: "Seu perfil inicial foi criado e ja pode ser usado nas proximas etapas da plataforma.",
      })
    } catch (error) {
      console.error("Failed to submit user registration", error)
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel concluir seu cadastro. Tente novamente em instantes."

      setFeedbackModal({
        type: "error",
        title: "Nao foi possivel concluir seu cadastro",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeFeedbackModal = () => {
    if (feedbackModal?.type === "success") {
      setCurrentStep(1)
      setRegistrationData({})
    }
    setFeedbackModal(null)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fff8f1_0%,_#ffffff_20%,_#f8fafc_100%)]">
      <header className="border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/jobs/list" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#FF6B00]">
            <ArrowLeft className="size-4" />
            Voltar
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/15 bg-[#FF6B00]/8 px-4 py-2 text-sm font-medium text-[#C44E00]">
            <UserRoundPlus className="size-4" />
            Cadastro de novos usuarios
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10">
        <section className="rounded-[2rem] border border-black/5 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)] md:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-200">ClusterHR</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Crie seu cadastro oficial na plataforma.</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Preencha suas informacoes pessoais, profissionais e preferencias para ativar seu perfil inicial.
          </p>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:px-8">
          <ProgressIndicator currentStep={currentStep} totalSteps={REGISTRATION_STEPS.length} steps={REGISTRATION_STEPS} />
        </section>

        {currentStep === 1 ? (
          <UserRegistrationPersonalStep data={registrationData} onUpdate={updateData} onNext={nextStep} />
        ) : null}

        {currentStep === 2 ? (
          <UserRegistrationProfessionalStep
            data={registrationData}
            onUpdate={updateData}
            onNext={nextStep}
            onBack={prevStep}
          />
        ) : null}

        {currentStep === 3 ? (
          <UserRegistrationPreferencesStep
            data={registrationData}
            onUpdate={updateData}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isSubmitting={isSubmitting}
          />
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
            <h3 className="text-xl font-semibold text-slate-950">{feedbackModal.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{feedbackModal.message}</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={closeFeedbackModal} size="lg" className="min-w-[180px] rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]">
                {feedbackModal.type === "success" ? "Fechar" : "Tentar novamente"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
