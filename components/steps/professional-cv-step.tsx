"use client"

import { Button } from "@/components/ui/button"

interface ProfessionalCvStepProps {
  onNext: () => void
  onBack: () => void
}

export function ProfessionalCvStep({ onNext, onBack }: ProfessionalCvStepProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Dados Profissionais</h2>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Adicione seu currículo em PDF para complementar seu perfil. Em breve você poderá fazer o upload diretamente
          por aqui.
        </p>
        <Button type="button" disabled className="w-full mt-4" size="lg">
          Upload CV (PDF)
        </Button>
      </div>

      <div className="flex gap-4 mt-8">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent" size="lg">
          Voltar
        </Button>
        <Button type="button" onClick={onNext} className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground" size="lg">
          Continuar
        </Button>
      </div>
    </div>
  )
}
