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
import { cn } from "@/lib/utils"

interface ProfessionalDataStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onNext: () => void
  onBack: () => void
}

const BRL_NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR")

function formatCurrencyInput(rawValue: string): string {
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

export function ProfessionalDataStep({ data, onUpdate, onNext, onBack }: ProfessionalDataStepProps) {
  const [formData, setFormData] = useState({
    experiencia: data.experiencia || "",
    industria: data.industria || "",
    salario: data.salario || "",
    cargoInteresse: data.cargoInteresse || "",
  })
  const [touched, setTouched] = useState({
    experiencia: false,
    industria: false,
    salario: false,
    cargoInteresse: false,
  })
  const [experienceOptions, setExperienceOptions] = useState<OnboardingOption[]>(defaultExperienceOptions)
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)
  const isFormComplete =
    Boolean(formData.experiencia) &&
    Boolean(formData.industria) &&
    Boolean(formData.salario.trim()) &&
    Boolean(formData.cargoInteresse.trim())
  const isSalaryMissing = formData.salario.trim().length === 0
  const experienceError =
    touched.experiencia && !formData.experiencia ? "Selecione seu nível de experiência." : ""
  const industryError = touched.industria && !formData.industria ? "Selecione a indústria." : ""
  const salaryError =
    touched.salario && isSalaryMissing ? "Informe um salário válido." : ""
  const roleError =
    touched.cargoInteresse && !formData.cargoInteresse.trim() ? "Informe o cargo de interesse." : ""

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
    if (!isFormComplete) {
      return
    }
    onUpdate(formData)
    onNext()
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Dados Profissionais</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="experiencia">Experiência</Label>
            <Select
              value={formData.experiencia}
              onValueChange={(value) => {
                setFormData({ ...formData, experiencia: value })
                if (!touched.experiencia) {
                  setTouched((previous) => ({ ...previous, experiencia: true }))
                }
              }}
              required
            >
              <SelectTrigger
                className={cn("bg-input", experienceError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={experienceError ? "true" : "false"}
                onBlur={() => {
                  if (!touched.experiencia) {
                    setTouched((previous) => ({ ...previous, experiencia: true }))
                  }
                }}
              >
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
            {experienceError ? <p className="text-xs text-destructive">{experienceError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="industria">Indústria</Label>
            <Select
              value={formData.industria}
              onValueChange={(value) => {
                setFormData({ ...formData, industria: value })
                if (!touched.industria) {
                  setTouched((previous) => ({ ...previous, industria: true }))
                }
              }}
              required
            >
              <SelectTrigger
                className={cn("bg-input", industryError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={industryError ? "true" : "false"}
                onBlur={() => {
                  if (!touched.industria) {
                    setTouched((previous) => ({ ...previous, industria: true }))
                  }
                }}
              >
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
            {industryError ? <p className="text-xs text-destructive">{industryError}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="salario">Salário</Label>
          <Input
            id="salario"
            type="text"
            placeholder="Ex: R$ 5.000,00"
            value={formData.salario}
            onChange={(e) =>
              setFormData({ ...formData, salario: formatCurrencyInput(e.target.value) })
            }
            onBlur={() => {
              if (!touched.salario) {
                setTouched((previous) => ({ ...previous, salario: true }))
              }
            }}
            required
            className={cn("bg-input", salaryError && "border-destructive focus-visible:ring-destructive/40")}
            inputMode="numeric"
            aria-invalid={salaryError ? "true" : "false"}
          />
          {salaryError ? <p className="text-xs text-destructive">{salaryError}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargoInteresse">Cargo de Interesse</Label>
          <Input
            id="cargoInteresse"
            type="text"
            placeholder="Ex: Desenvolvedor Full Stack"
            value={formData.cargoInteresse}
            onChange={(e) => setFormData({ ...formData, cargoInteresse: e.target.value })}
            onBlur={() => {
              if (!touched.cargoInteresse) {
                setTouched((previous) => ({ ...previous, cargoInteresse: true }))
              }
            }}
            required
            className={cn("bg-input", roleError && "border-destructive focus-visible:ring-destructive/40")}
            aria-invalid={roleError ? "true" : "false"}
          />
          {roleError ? <p className="text-xs text-destructive">{roleError}</p> : null}
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent" size="lg">
            Voltar
          </Button>
          <Button
            type="submit"
            className={cn(
              "flex-1",
              isFormComplete
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
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
