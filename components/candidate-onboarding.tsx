"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, CircleAlert } from "lucide-react"

import { Header } from "./header"
import { PersonalDataStep } from "./steps/personal-data-step"
import { ProfessionalDataStep } from "./steps/professional-data-step"
import { ProfessionalCvStep } from "./steps/professional-cv-step"
import { ProfessionalInterestsStep } from "./steps/professional-interests-step"
import { ProgressIndicator } from "./progress-indicator"
import { Button } from "@/components/ui/button"
import { submitCandidateProfile, type CandidateProfilePayload } from "@/services/candidate-service"

export type CandidateData = {
  // Personal Data
  nome: string
  documento: string
  localResidencia: string
  endereco: string
  contatoCel: string
  contato: string
  lgpdAccepted: boolean

  // Professional Data
  experiencia: string
  industria: string
  salario: string
  cargoInteresse: string

  // Professional Interests
  industriaInteresse: string
  cargoInteresseDetalhado: string
  tipoTrabalho: string
  tipoContratacao: string
  compartilhamentoAccepted: boolean
}

type SubmissionFeedback = {
  type: "success" | "error"
  title: string
  message: string
}

export function CandidateOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [candidateData, setCandidateData] = useState<Partial<CandidateData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<SubmissionFeedback | null>(null)

  const updateData = (data: Partial<CandidateData>) => {
    setCandidateData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (finalStepData?: Partial<CandidateData>) => {
    const mergedData: Partial<CandidateData> = {
      ...candidateData,
      ...(finalStepData ?? {}),
    }

    if (!isCandidateDataComplete(mergedData)) {
      alert("Por favor, preencha todas as etapas antes de finalizar o cadastro.")
      return
    }

    setIsSubmitting(true)

    const payload: CandidateProfilePayload = {
      ...(mergedData as CandidateData),
      guid_id: crypto.randomUUID(),
      cd_cnpj: generateRandomCnpj(),
    }

    try {
      await submitCandidateProfile(payload)
      setFeedbackModal({
        type: "success",
        title: "Cadastro enviado com sucesso!",
        message: "Recebemos seus dados e em breve entraremos em contato.",
      })
    } catch (error) {
      console.error("Failed to submit candidate profile", error)
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível enviar seus dados. Tente novamente em instantes."
      setFeedbackModal({
        type: "error",
        title: "Não conseguimos finalizar seu cadastro",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const closeFeedbackModal = () => {
    const shouldRedirectHome = feedbackModal?.type === "success"
    setFeedbackModal(null)
    if (shouldRedirectHome) {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={currentStep} totalSteps={4} />

        <div className="mt-8">
          {currentStep === 1 && <PersonalDataStep data={candidateData} onUpdate={updateData} onNext={nextStep} />}

          {currentStep === 2 && (
            <ProfessionalDataStep data={candidateData} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />
          )}

          {currentStep === 3 && <ProfessionalCvStep onNext={nextStep} onBack={prevStep} />}

          {currentStep === 4 && (
            <ProfessionalInterestsStep
              data={candidateData}
              onUpdate={updateData}
              onSubmit={handleSubmit}
              onBack={prevStep}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-card p-8 text-center shadow-xl">
            {feedbackModal.type === "success" ? (
              <CheckCircle2 className="mx-auto mb-4 size-12 text-green-500" aria-hidden="true" />
            ) : (
              <CircleAlert className="mx-auto mb-4 size-12 text-destructive" aria-hidden="true" />
            )}
            <h3 className="text-xl font-semibold text-foreground">{feedbackModal.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{feedbackModal.message}</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={closeFeedbackModal} size="lg" className="min-w-[180px]">
                {feedbackModal.type === "success" ? "Voltar para início" : "Tentar novamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isCandidateDataComplete(data: Partial<CandidateData>): data is CandidateData {
  return (
    Boolean(data.nome) &&
    Boolean(data.documento) &&
    Boolean(data.localResidencia) &&
    Boolean(data.endereco) &&
    Boolean(data.contatoCel) &&
    Boolean(data.contato) &&
    data.lgpdAccepted === true &&
    Boolean(data.experiencia) &&
    Boolean(data.industria) &&
    Boolean(data.salario) &&
    Boolean(data.cargoInteresse) &&
    Boolean(data.industriaInteresse) &&
    Boolean(data.cargoInteresseDetalhado) &&
    Boolean(data.tipoTrabalho) &&
    Boolean(data.tipoContratacao) &&
    data.compartilhamentoAccepted === true
  )
}

// TODO: substituir o CNPJ gerado aleatoriamente quando o valor real da empresa estiver disponível.
function generateRandomCnpj(): string {
  let digits = ""
  while (digits.length < 14) {
    digits += crypto.randomUUID().replace(/\D/g, "")
  }
  return digits.slice(0, 14)
}
