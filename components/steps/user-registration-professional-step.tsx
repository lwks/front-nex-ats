"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultHardSkillOptions,
  defaultIndustryOptions,
  defaultLanguageOptions,
  defaultLanguageProficiencyOptions,
  defaultSeniorityOptions,
  defaultSoftSkillOptions,
  topSectorOptions,
  type LanguageProficiencyOption,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { cn } from "@/lib/utils"
import {
  fetchCurrentBenefitOptions,
  fetchExperienceOptions,
  fetchHardSkillOptions,
  fetchIndustryOptions,
  fetchLanguageOptions,
  fetchLanguageProficiencyOptions,
  fetchSeniorityOptions,
  fetchSoftSkillOptions,
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
  return languages.every((language) => language.idioma.trim().length > 0 && language.fluencia.trim().length > 0)
}

export function UserRegistrationProfessionalStep({
  data,
  onBack,
  onNext,
  onUpdate,
}: UserRegistrationProfessionalStepProps) {
  const [formData, setFormData] = useState({
    experiencia: data.experiencia || "",
    salarioAtual: data.salarioAtual || "",
    empresaAtual: data.empresaAtual || "",
    senioridade: data.senioridade || "",
    setorAtual: data.setorAtual || "",
    timeAtual: data.timeAtual || "",
    beneficiosAtuais: data.beneficiosAtuais || [],
    industriaInteresse: data.industriaInteresse || [],
    hardSkillsProfissionais: data.hardSkillsProfissionais || [],
    softSkillsProfissionais: data.softSkillsProfissionais || [],
    idiomas: data.idiomas || [],
  })
  const [touched, setTouched] = useState({
    experiencia: false,
    salarioAtual: false,
    empresaAtual: false,
    senioridade: false,
    setorAtual: false,
    timeAtual: false,
    beneficiosAtuais: false,
    industriaInteresse: false,
    hardSkillsProfissionais: false,
    softSkillsProfissionais: false,
    idiomas: false,
  })
  const [experienceOptions, setExperienceOptions] = useState<OnboardingOption[]>(defaultExperienceOptions)
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)
  const [seniorityOptions, setSeniorityOptions] = useState<OnboardingOption[]>(defaultSeniorityOptions)
  const [benefitOptions, setBenefitOptions] = useState<OnboardingOption[]>(defaultCurrentBenefitOptions)
  const [hardSkillOptions, setHardSkillOptions] = useState<OnboardingOption[]>(defaultHardSkillOptions)
  const [softSkillOptions, setSoftSkillOptions] = useState<OnboardingOption[]>(defaultSoftSkillOptions)
  const [languageOptions, setLanguageOptions] = useState<OnboardingOption[]>(defaultLanguageOptions)
  const [languageProficiencyOptions, setLanguageProficiencyOptions] = useState<LanguageProficiencyOption[]>(
    defaultLanguageProficiencyOptions,
  )

  const isFormComplete =
    Boolean(formData.experiencia) &&
    Boolean(formData.salarioAtual.trim()) &&
    Boolean(formData.empresaAtual.trim()) &&
    Boolean(formData.senioridade) &&
    Boolean(formData.setorAtual.trim()) &&
    Boolean(formData.timeAtual.trim()) &&
    formData.beneficiosAtuais.length > 0 &&
    formData.industriaInteresse.length > 0 &&
    formData.industriaInteresse.length <= 3 &&
    formData.hardSkillsProfissionais.length > 0 &&
    formData.hardSkillsProfissionais.length <= 7 &&
    formData.softSkillsProfissionais.length > 0 &&
    formData.softSkillsProfissionais.length <= 7 &&
    hasCompleteLanguages(formData.idiomas)

  const experienceError =
    touched.experiencia && !formData.experiencia ? "Selecione seu nivel de experiencia." : ""
  const salaryError =
    touched.salarioAtual && !formData.salarioAtual.trim() ? "Informe o salario atual." : ""
  const companyError =
    touched.empresaAtual && !formData.empresaAtual.trim() ? "Informe a empresa atual." : ""
  const seniorityError =
    touched.senioridade && !formData.senioridade ? "Selecione a senioridade atual." : ""
  const currentSectorError =
    touched.setorAtual && !formData.setorAtual.trim() ? "Informe o setor atual." : ""
  const currentTeamError =
    touched.timeAtual && !formData.timeAtual.trim() ? "Informe o time atual." : ""
  const benefitError =
    touched.beneficiosAtuais && formData.beneficiosAtuais.length === 0
      ? "Selecione ao menos um beneficio atual."
      : ""
  const areaError =
    touched.industriaInteresse && formData.industriaInteresse.length === 0
      ? "Selecione ao menos uma area."
      : touched.industriaInteresse && formData.industriaInteresse.length > 3
        ? "Selecione no maximo 3 areas."
        : ""
  const hardSkillError =
    touched.hardSkillsProfissionais && formData.hardSkillsProfissionais.length === 0
      ? "Selecione ao menos uma hard skill profissional."
      : touched.hardSkillsProfissionais && formData.hardSkillsProfissionais.length > 7
        ? "Selecione no maximo 7 hard skills profissionais."
        : ""
  const softSkillError =
    touched.softSkillsProfissionais && formData.softSkillsProfissionais.length === 0
      ? "Selecione ao menos uma soft skill profissional."
      : touched.softSkillsProfissionais && formData.softSkillsProfissionais.length > 7
        ? "Selecione no maximo 7 soft skills profissionais."
        : ""
  const languageError =
    touched.idiomas && formData.idiomas.length > 0 && !hasCompleteLanguages(formData.idiomas)
      ? "Selecione ao menos um idioma e informe sua fluencia."
      : ""

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [
        experiences,
        industries,
        seniorities,
        benefits,
        hardSkills,
        softSkills,
        languages,
        proficiencies,
      ] = await Promise.all([
        fetchExperienceOptions(),
        fetchIndustryOptions(),
        fetchSeniorityOptions(),
        fetchCurrentBenefitOptions(),
        fetchHardSkillOptions(),
        fetchSoftSkillOptions(),
        fetchLanguageOptions(),
        fetchLanguageProficiencyOptions(),
      ])

      if (isMounted) {
        setExperienceOptions(experiences)
        setIndustryOptions(industries)
        setSeniorityOptions(seniorities)
        setBenefitOptions(benefits)
        setHardSkillOptions(hardSkills)
        setSoftSkillOptions(softSkills)
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
    setFormData((previous) => ({
      ...previous,
      idiomas: previous.idiomas.filter((_, currentIndex) => currentIndex !== index),
    }))
    setTouched((previous) => ({ ...previous, idiomas: true }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isFormComplete) {
      setTouched({
        experiencia: true,
        salarioAtual: true,
        empresaAtual: true,
        senioridade: true,
        setorAtual: true,
        timeAtual: true,
        beneficiosAtuais: true,
        industriaInteresse: true,
        hardSkillsProfissionais: true,
        softSkillsProfissionais: true,
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
          Conte sua experiencia, contexto profissional atual, area de atuacao e idiomas, se desejar informar.
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
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="empresaAtual">Empresa Atual</Label>
            <Input
              id="empresaAtual"
              value={formData.empresaAtual}
              onChange={(event) => setFormData({ ...formData, empresaAtual: event.target.value })}
              onBlur={() => {
                if (!touched.empresaAtual) {
                  setTouched((previous) => ({ ...previous, empresaAtual: true }))
                }
              }}
              className={cn(companyError && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={companyError ? "true" : "false"}
            />
            {companyError ? <p className="text-xs text-destructive">{companyError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setorAtual">Setor</Label>
            <Select
              value={formData.setorAtual}
              onValueChange={(value) => {
                setFormData({ ...formData, setorAtual: value })
                if (!touched.setorAtual) {
                  setTouched((previous) => ({ ...previous, setorAtual: true }))
                }
              }}
            >
              <SelectTrigger
                id="setorAtual"
                className={cn("w-full", currentSectorError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={currentSectorError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione o setor atual" />
              </SelectTrigger>
              <SelectContent>
                {topSectorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentSectorError ? <p className="text-xs text-destructive">{currentSectorError}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="industriaInteresse">Area</Label>
            <MultiSelect
              id="industriaInteresse"
              maxSelections={3}
              options={industryOptions}
              placeholder="Selecione ate 3 areas"
              value={formData.industriaInteresse}
              onChange={(value) => {
                setFormData({ ...formData, industriaInteresse: value })
                if (!touched.industriaInteresse) {
                  setTouched((previous) => ({ ...previous, industriaInteresse: true }))
                }
              }}
            />
            {areaError ? <p className="text-xs text-destructive">{areaError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeAtual">Time</Label>
            <Input
              id="timeAtual"
              value={formData.timeAtual}
              onChange={(event) => setFormData({ ...formData, timeAtual: event.target.value })}
              onBlur={() => {
                if (!touched.timeAtual) {
                  setTouched((previous) => ({ ...previous, timeAtual: true }))
                }
              }}
              className={cn(currentTeamError && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={currentTeamError ? "true" : "false"}
            />
            {currentTeamError ? <p className="text-xs text-destructive">{currentTeamError}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="senioridade">Senioridade</Label>
            <Select
              value={formData.senioridade}
              onValueChange={(value) => {
                setFormData({ ...formData, senioridade: value })
                if (!touched.senioridade) {
                  setTouched((previous) => ({ ...previous, senioridade: true }))
                }
              }}
            >
              <SelectTrigger
                id="senioridade"
                className={cn("w-full", seniorityError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={seniorityError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione a senioridade atual" />
              </SelectTrigger>
              <SelectContent>
                {seniorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {seniorityError ? <p className="text-xs text-destructive">{seniorityError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiosAtuais">Beneficios</Label>
            <MultiSelect
              id="beneficiosAtuais"
              options={benefitOptions}
              placeholder="Selecione seus beneficios"
              value={formData.beneficiosAtuais}
              onChange={(value) => {
                setFormData({ ...formData, beneficiosAtuais: value })
                if (!touched.beneficiosAtuais) {
                  setTouched((previous) => ({ ...previous, beneficiosAtuais: true }))
                }
              }}
            />
            {benefitError ? <p className="text-xs text-destructive">{benefitError}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hardSkillsProfissionais">Hard Skills</Label>
            <MultiSelect
              id="hardSkillsProfissionais"
              maxSelections={7}
              options={hardSkillOptions}
              placeholder="Selecione ate 7 hard skills"
              value={formData.hardSkillsProfissionais}
              onChange={(value) => {
                setFormData({ ...formData, hardSkillsProfissionais: value })
                if (!touched.hardSkillsProfissionais) {
                  setTouched((previous) => ({ ...previous, hardSkillsProfissionais: true }))
                }
              }}
            />
            {hardSkillError ? <p className="text-xs text-destructive">{hardSkillError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="softSkillsProfissionais">Soft Skills</Label>
            <MultiSelect
              id="softSkillsProfissionais"
              maxSelections={7}
              options={softSkillOptions}
              placeholder="Selecione ate 7 soft skills"
              value={formData.softSkillsProfissionais}
              onChange={(value) => {
                setFormData({ ...formData, softSkillsProfissionais: value })
                if (!touched.softSkillsProfissionais) {
                  setTouched((previous) => ({ ...previous, softSkillsProfissionais: true }))
                }
              }}
            />
            {softSkillError ? <p className="text-xs text-destructive">{softSkillError}</p> : null}
          </div>
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
