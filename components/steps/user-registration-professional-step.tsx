"use client"

import type React from "react"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultExperienceOptions,
  defaultIndustryOptions,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { fetchExperienceOptions, fetchIndustryOptions } from "@/services/onboarding-options-service"
import type { UserRegistrationData } from "@/services/user-registration-service"
import { cn } from "@/lib/utils"

type UserRegistrationProfessionalStepProps = {
  data: Partial<UserRegistrationData>
  onBack: () => void
  onNext: () => void
  onUpdate: (data: Partial<UserRegistrationData>) => void
}

const BRL_NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR")

function formatCurrencyInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, "")
  if (digitsOnly.length === 0) {
    return ""
  }

  const numericValue = Number(digitsOnly)
  if (Number.isNaN(numericValue)) {
    return ""
  }

  return BRL_NUMBER_FORMATTER.format(numericValue)
}

export function UserRegistrationProfessionalStep({
  data,
  onBack,
  onNext,
  onUpdate,
}: UserRegistrationProfessionalStepProps) {
  const [formData, setFormData] = useState({
    experiencia: data.experiencia || "",
    industria: data.industria || "",
    salarioAtual: data.salarioAtual || "",
    cargoAtual: data.cargoAtual || "",
  })
  const [touched, setTouched] = useState({
    experiencia: false,
    industria: false,
    salarioAtual: false,
    cargoAtual: false,
  })
  const [experienceOptions, setExperienceOptions] = useState<OnboardingOption[]>(defaultExperienceOptions)
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)

  const isFormComplete =
    Boolean(formData.experiencia) &&
    Boolean(formData.industria) &&
    Boolean(formData.salarioAtual.trim()) &&
    Boolean(formData.cargoAtual.trim())

  const experienceError =
    touched.experiencia && !formData.experiencia ? "Selecione seu nivel de experiencia." : ""
  const industryError = touched.industria && !formData.industria ? "Selecione a industria atual." : ""
  const salaryError =
    touched.salarioAtual && !formData.salarioAtual.trim() ? "Informe o salario atual." : ""
  const roleError =
    touched.cargoAtual && !formData.cargoAtual.trim() ? "Informe o cargo atual." : ""

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isFormComplete) {
      return
    }
    onUpdate(formData)
    onNext()
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Dados profissionais</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Conte seu momento atual para personalizar seu perfil na plataforma.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="experiencia">Experiencia</Label>
            <Select
              value={formData.experiencia}
              onValueChange={(value) => {
                setFormData({ ...formData, experiencia: value })
                if (!touched.experiencia) {
                  setTouched((previous) => ({ ...previous, experiencia: true }))
                }
              }}
            >
              <SelectTrigger
                id="experiencia"
                className={cn("w-full", experienceError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={experienceError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione seu nivel de experiencia" />
              </SelectTrigger>
              <SelectContent>
                {experienceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {experienceError ? <p className="text-xs text-destructive">{experienceError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industria">Industria atual</Label>
            <Select
              value={formData.industria}
              onValueChange={(value) => {
                setFormData({ ...formData, industria: value })
                if (!touched.industria) {
                  setTouched((previous) => ({ ...previous, industria: true }))
                }
              }}
            >
              <SelectTrigger
                id="industria"
                className={cn("w-full", industryError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={industryError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione a industria atual" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {industryError ? <p className="text-xs text-destructive">{industryError}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="salarioAtual">Salario atual</Label>
            <Input
              id="salarioAtual"
              inputMode="numeric"
              value={formData.salarioAtual}
              onChange={(event) => setFormData({ ...formData, salarioAtual: formatCurrencyInput(event.target.value) })}
              onBlur={() => {
                if (!touched.salarioAtual) {
                  setTouched((previous) => ({ ...previous, salarioAtual: true }))
                }
              }}
              className={cn(salaryError && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={salaryError ? "true" : "false"}
            />
            {salaryError ? <p className="text-xs text-destructive">{salaryError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargoAtual">Cargo atual</Label>
            <Input
              id="cargoAtual"
              value={formData.cargoAtual}
              onChange={(event) => setFormData({ ...formData, cargoAtual: event.target.value })}
              onBlur={() => {
                if (!touched.cargoAtual) {
                  setTouched((previous) => ({ ...previous, cargoAtual: true }))
                }
              }}
              className={cn(roleError && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={roleError ? "true" : "false"}
            />
            {roleError ? <p className="text-xs text-destructive">{roleError}</p> : null}
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full bg-transparent" size="lg">
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]"
            size="lg"
            disabled={!isFormComplete}
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  )
}
