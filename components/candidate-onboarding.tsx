"use client"

import { useState } from "react"
import { Header } from "./header"
import { PersonalDataStep } from "./steps/personal-data-step"
import { ProfessionalDataStep } from "./steps/professional-data-step"
import { ProfessionalInterestsStep } from "./steps/professional-interests-step"
import { ProgressIndicator } from "./progress-indicator"

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
  const [currentStep, setCurrentStep] = useState(1)
  const [candidateData, setCandidateData] = useState<Partial<CandidateData>>({})

  const updateData = (data: Partial<CandidateData>) => {
    setCandidateData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Candidate data submitted:", candidateData)
    // Here you would send the data to your backend
    alert("Cadastro realizado com sucesso!")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={currentStep} totalSteps={3} />

        <div className="mt-8">
          {currentStep === 1 && <PersonalDataStep data={candidateData} onUpdate={updateData} onNext={nextStep} />}

          {currentStep === 2 && (
            <ProfessionalDataStep data={candidateData} onUpdate={updateData} onNext={nextStep} onBack={prevStep} />
          )}

          {currentStep === 3 && (
            <ProfessionalInterestsStep
              data={candidateData}
              onUpdate={updateData}
              onSubmit={handleSubmit}
              onBack={prevStep}
            />
          )}
        </div>
      </div>
    </div>
  )
}
