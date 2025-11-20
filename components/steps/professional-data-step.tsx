"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CandidateData } from "../candidate-onboarding"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultExperienceOptions,
  defaultIndustryOptions,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { fetchExperienceOptions, fetchIndustryOptions } from "@/services/onboarding-options-service"

interface ProfessionalDataStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onNext: () => void
  onBack: () => void
}

export function ProfessionalDataStep({ data, onUpdate, onNext, onBack }: ProfessionalDataStepProps) {
  const [formData, setFormData] = useState({
    experiencia: data.experiencia || "",
    industria: data.industria || "",
    salario: data.salario || "",
    cargoInteresse: data.cargoInteresse || "",
  })
  const [experienceOptions, setExperienceOptions] = useState<OnboardingOption[]>(defaultExperienceOptions)
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [experiences, industries] = await Promise.all([fetchExperienceOptions(), fetchIndustryOptions()])

      if (isMounted) {
        setExperienceOptions(experiences)
        setIndustryOptions(industries)
      }
    }

    loadOptions().catch((error) => console.error("Failed to load professional data options", error))

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
    onNext()
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Dados Profissionais</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="experiencia">Experiência</Label>
          <Select
            value={formData.experiencia}
            onValueChange={(value) => setFormData({ ...formData, experiencia: value })}
            required
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Selecione seu nível de experiência" />
            </SelectTrigger>
            <SelectContent>
              {experienceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industria">Indústria</Label>
          <Select
            value={formData.industria}
            onValueChange={(value) => setFormData({ ...formData, industria: value })}
            required
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Selecione a indústria" />
            </SelectTrigger>
            <SelectContent>
              {industryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salario">Salário</Label>
          <Input
            id="salario"
            type="text"
            placeholder="Ex: R$ 5.000,00"
            value={formData.salario}
            onChange={(e) => setFormData({ ...formData, salario: e.target.value })}
            required
            className="bg-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargoInteresse">Cargo de Interesse</Label>
          <Input
            id="cargoInteresse"
            type="text"
            placeholder="Ex: Desenvolvedor Full Stack"
            value={formData.cargoInteresse}
            onChange={(e) => setFormData({ ...formData, cargoInteresse: e.target.value })}
            required
            className="bg-input"
          />
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent" size="lg">
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  )
}
