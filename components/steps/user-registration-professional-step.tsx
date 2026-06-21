"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultExperienceOptions,
  defaultIndustryOptions,
  defaultLanguageOptions,
  defaultLanguageProficiencyOptions,
  type LanguageProficiencyOption,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { cn } from "@/lib/utils"
import {
  fetchExperienceOptions,
  fetchIndustryOptions,
  fetchLanguageOptions,
  fetchLanguageProficiencyOptions,
} from "@/services/onboarding-options-service"
import type { UserRegistrationData, UserRegistrationLanguage } from "@/services/user-registration-service"

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

function createEmptyLanguage(): UserRegistrationLanguage {
  return {
    idioma: "",
    fluencia: "",
  }
}

function hasCompleteLanguages(languages: UserRegistrationLanguage[]) {
  return (
    languages.length > 0 &&
    languages.every((language) => language.idioma.trim().length > 0 && language.fluencia.trim().length > 0)
  )
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
    idiomas: data.idiomas && data.idiomas.length > 0 ? data.idiomas : [createEmptyLanguage()],
  })
  const [touched, setTouched] = useState({
    experiencia: false,
    industria: false,
    salarioAtual: false,
    idiomas: false,
  })
  const [experienceOptions, setExperienceOptions] = useState<OnboardingOption[]>(defaultExperienceOptions)
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)
  const [languageOptions, setLanguageOptions] = useState<OnboardingOption[]>(defaultLanguageOptions)
  const [languageProficiencyOptions, setLanguageProficiencyOptions] = useState<LanguageProficiencyOption[]>(
    defaultLanguageProficiencyOptions,
  )

  const isFormComplete =
    Boolean(formData.experiencia) &&
    Boolean(formData.industria) &&
    Boolean(formData.salarioAtual.trim()) &&
    hasCompleteLanguages(formData.idiomas)

  const experienceError =
    touched.experiencia && !formData.experiencia ? "Selecione seu nivel de experiencia." : ""
  const industryError = touched.industria && !formData.industria ? "Selecione a industria atual." : ""
  const salaryError =
    touched.salarioAtual && !formData.salarioAtual.trim() ? "Informe o salario atual." : ""
  const languageError =
    touched.idiomas && !hasCompleteLanguages(formData.idiomas)
      ? "Selecione ao menos um idioma e informe sua fluencia."
      : ""

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [experiences, industries, languages, proficiencies] = await Promise.all([
        fetchExperienceOptions(),
        fetchIndustryOptions(),
        fetchLanguageOptions(),
        fetchLanguageProficiencyOptions(),
      ])

      if (isMounted) {
        setExperienceOptions(experiences)
        setIndustryOptions(industries)
        setLanguageOptions(languages)
        setLanguageProficiencyOptions(proficiencies)
      }
    }

    loadOptions().catch((error) => console.error("Failed to load professional data options", error))

    return () => {
      isMounted = false
    }
  }, [])

  const handleLanguageChange = (index: number, field: keyof UserRegistrationLanguage, value: string) => {
    setFormData((previous) => ({
      ...previous,
      idiomas: previous.idiomas.map((language, currentIndex) =>
        currentIndex === index ? { ...language, [field]: value } : language,
      ),
    }))

    if (!touched.idiomas) {
      setTouched((previous) => ({ ...previous, idiomas: true }))
    }
  }

  const addLanguage = () => {
    setFormData((previous) => ({
      ...previous,
      idiomas: [...previous.idiomas, createEmptyLanguage()],
    }))
    setTouched((previous) => ({ ...previous, idiomas: true }))
  }

  const removeLanguage = (index: number) => {
    setFormData((previous) => {
      const nextLanguages = previous.idiomas.filter((_, currentIndex) => currentIndex !== index)
      return {
        ...previous,
        idiomas: nextLanguages.length > 0 ? nextLanguages : [createEmptyLanguage()],
      }
    })
    setTouched((previous) => ({ ...previous, idiomas: true }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isFormComplete) {
      setTouched({
        experiencia: true,
        industria: true,
        salarioAtual: true,
        idiomas: true,
      })
      return
    }
    onUpdate(formData)
    onNext()
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Experiencia profissional</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Conte sua experiencia atual e os idiomas com nivel de fluencia.
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

        <div className="space-y-4 rounded-[1.5rem] border border-slate-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Label>Idiomas</Label>
              <p className="mt-1 text-sm text-slate-500">Informe os idiomas e o nivel de fluencia de cada um.</p>
            </div>
            <Button type="button" variant="outline" onClick={addLanguage} className="rounded-full bg-transparent">
              <Plus className="mr-2 size-4" />
              Adicionar idioma
            </Button>
          </div>

          <div className="space-y-4">
            {formData.idiomas.map((language, index) => (
              <div key={`${index}-${language.idioma}-${language.fluencia}`} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <div className="space-y-2">
                  <Label htmlFor={`idioma-${index}`}>Idioma</Label>
                  <Select
                    value={language.idioma}
                    onValueChange={(value) => handleLanguageChange(index, "idioma", value)}
                  >
                    <SelectTrigger
                      id={`idioma-${index}`}
                      className={cn("w-full", languageError && "border-destructive focus-visible:ring-destructive/40")}
                      aria-invalid={languageError ? "true" : "false"}
                    >
                      <SelectValue placeholder="Selecione o idioma" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`fluencia-${index}`}>Fluencia</Label>
                  <Select
                    value={language.fluencia}
                    onValueChange={(value) => handleLanguageChange(index, "fluencia", value)}
                  >
                    <SelectTrigger
                      id={`fluencia-${index}`}
                      className={cn("w-full", languageError && "border-destructive focus-visible:ring-destructive/40")}
                      aria-invalid={languageError ? "true" : "false"}
                    >
                      <SelectValue placeholder="Selecione a fluencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageProficiencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeLanguage(index)}
                    className="w-full rounded-full bg-transparent md:w-auto"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remover idioma</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {languageError ? <p className="text-xs text-destructive">{languageError}</p> : null}
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
