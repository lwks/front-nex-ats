"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { Header } from "./header"
import { PersonalDataStep } from "./steps/personal-data-step"
import { ProfessionalDataStep } from "./steps/professional-data-step"
import { ProfessionalCvStep } from "./steps/professional-cv-step"
import { ProfessionalInterestsStep } from "./steps/professional-interests-step"
import { ProgressIndicator } from "./progress-indicator"
import { submitCandidateProfile, type CandidateProfilePayload } from "@/services/candidate-service"

export type CandidateData = {
  // Personal Data
  nome: string
  documento: string
  localResidencia: string
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

export function CandidateOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [candidateData, setCandidateData] = useState<Partial<CandidateData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)

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

    setSubmissionError(null)
    setSubmissionSuccess(false)
    setIsSubmitting(true)

    const payload: CandidateProfilePayload = {
      ...(mergedData as CandidateData),
      guid_id: crypto.randomUUID(),
      cd_cnpj: generateRandomCnpj(),
    }

    try {
      await submitCandidateProfile(payload)
      setSubmissionSuccess(true)
      alert("Cadastro realizado com sucesso!")
      router.push("/")
    } catch (error) {
      console.error("Failed to submit candidate profile", error)
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar seus dados. Tente novamente em instantes.",
      )
    } finally {
      setIsSubmitting(false)
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
              errorMessage={submissionError}
            />
          )}
          {submissionSuccess && (
            <p className="mt-6 text-sm text-green-600" role="status">
              Seus dados foram enviados com sucesso.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function isCandidateDataComplete(data: Partial<CandidateData>): data is CandidateData {
  return (
    Boolean(data.nome) &&
    Boolean(data.documento) &&
    Boolean(data.localResidencia) &&
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
