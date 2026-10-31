"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultLanguageOptions,
  defaultLanguageProficiencyOptions,
  MAX_AREA_SELECTIONS,
  MAX_SKILL_SELECTIONS,
  MAX_TEAM_SELECTIONS,
  defaultSeniorityOptions,
  defaultSoftSkillOptions,
  getTeamOptionsForAreas,
  normalizeTeamValueForAreas,
  normalizeTeamValues,
  topSectorOptions,
  type LanguageProficiencyOption,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { cn } from "@/lib/utils"
import {
  fetchCurrentBenefitOptions,
  fetchExperienceOptions,
  fetchLanguageOptions,
  fetchLanguageProficiencyOptions,
  fetchSeniorityOptions,
  fetchSoftSkillOptions,
} from "@/services/onboarding-options-service"
import type { UserRegistrationData, UserRegistrationLanguage } from "@/services/user-registration-service"
import { useAreaOptions } from "@/hooks/use-area-options"
import { getHardSkillOptionsForAreas } from "@/services/hard-skills-service"

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

function createEmptyRecommendation() {
  return { nome: "", telefone: "", cargo: "" }
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
    indicacoes: (data.indicacoes ?? (data.indicacao ? [data.indicacao] : [])).map((recommendation) => ({
      nome: recommendation.nome || "",
      telefone: (recommendation.telefone || "").replace(/\D/g, "").slice(0, 11),
      cargo: recommendation.cargo || "",
    })),
    senioridade: data.senioridade || "",
    setorAtual: data.setorAtual || "",
    timeAtual: normalizeTeamValues(data.timeAtual),
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
    indicacoes: [] as number[],
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
  const industryOptions = useAreaOptions()
  const [seniorityOptions, setSeniorityOptions] = useState<OnboardingOption[]>(defaultSeniorityOptions)
  const [benefitOptions, setBenefitOptions] = useState<OnboardingOption[]>(defaultCurrentBenefitOptions)
  const [softSkillOptions, setSoftSkillOptions] = useState<OnboardingOption[]>(defaultSoftSkillOptions)
  const [languageOptions, setLanguageOptions] = useState<OnboardingOption[]>(defaultLanguageOptions)
  const [languageProficiencyOptions, setLanguageProficiencyOptions] = useState<LanguageProficiencyOption[]>(
    defaultLanguageProficiencyOptions,
  )
  const hardSkillOptions = useMemo(
    () => getHardSkillOptionsForAreas(formData.industriaInteresse, industryOptions),
    [formData.industriaInteresse, industryOptions],
  )
  const teamOptions = useMemo(
    () => getTeamOptionsForAreas(formData.industriaInteresse, industryOptions),
    [formData.industriaInteresse, industryOptions],
  )
  const hasRecommendationData = (recommendation: typeof formData.indicacoes[number]) =>
    Object.values(recommendation).some((value) => value.trim().length > 0)
  const isRecommendationValid = formData.indicacoes.every((recommendation) => {
    if (!hasRecommendationData(recommendation)) return true
    return recommendation.nome.trim().split(/\s+/).length >= 2 &&
      recommendation.telefone.length >= 10 &&
      recommendation.telefone.length <= 11 &&
      Boolean(recommendation.cargo.trim())
  })
  const recommendationErrors = formData.indicacoes.map((recommendation, index) => {
    const showErrors = touched.indicacoes.includes(index) && hasRecommendationData(recommendation)
    return {
      name: showErrors && recommendation.nome.trim().split(/\s+/).length < 2
        ? recommendation.nome.trim() ? "Informe nome e sobrenome da pessoa indicada." : "Informe o nome da pessoa indicada."
        : "",
      phone: showErrors && (recommendation.telefone.length < 10 || recommendation.telefone.length > 11)
        ? "Informe um telefone com DDD e 10 ou 11 digitos."
        : "",
      role: showErrors && !recommendation.cargo.trim() ? "Informe o cargo da pessoa indicada." : "",
    }
  })

  useEffect(() => {
    setFormData((previous) => {
      const nextTime = normalizeTeamValueForAreas(previous.timeAtual, previous.industriaInteresse, industryOptions)
      return nextTime.length === previous.timeAtual.length &&
        nextTime.every((team, index) => team === previous.timeAtual[index])
        ? previous
        : { ...previous, timeAtual: nextTime }
    })
  }, [formData.industriaInteresse, industryOptions])

  const isFormComplete =
    Boolean(formData.experiencia) &&
    Boolean(formData.salarioAtual.trim()) &&
    Boolean(formData.empresaAtual.trim()) &&
    isRecommendationValid &&
    Boolean(formData.senioridade) &&
    Boolean(formData.setorAtual.trim()) &&
    formData.timeAtual.length > 0 &&
    formData.timeAtual.length <= MAX_TEAM_SELECTIONS &&
    formData.beneficiosAtuais.length > 0 &&
    formData.industriaInteresse.length > 0 &&
    formData.industriaInteresse.length <= MAX_AREA_SELECTIONS &&
    formData.hardSkillsProfissionais.length > 0 &&
    formData.hardSkillsProfissionais.length <= MAX_SKILL_SELECTIONS &&
    formData.softSkillsProfissionais.length > 0 &&
    formData.softSkillsProfissionais.length <= MAX_SKILL_SELECTIONS &&
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
    touched.timeAtual && formData.timeAtual.length === 0
      ? "Selecione ao menos um time atual."
      : touched.timeAtual && formData.timeAtual.length > MAX_TEAM_SELECTIONS
        ? `Selecione no maximo ${MAX_TEAM_SELECTIONS} times atuais.`
        : ""
  const benefitError =
    touched.beneficiosAtuais && formData.beneficiosAtuais.length === 0
      ? "Selecione ao menos um beneficio atual."
      : ""
  const areaError =
    touched.industriaInteresse && formData.industriaInteresse.length === 0
      ? "Selecione ao menos uma area."
      : touched.industriaInteresse && formData.industriaInteresse.length > MAX_AREA_SELECTIONS
        ? `Selecione no maximo ${MAX_AREA_SELECTIONS} area.`
        : ""
  const hardSkillError =
    touched.hardSkillsProfissionais && formData.hardSkillsProfissionais.length === 0
      ? "Selecione ao menos uma hard skill profissional."
      : touched.hardSkillsProfissionais && formData.hardSkillsProfissionais.length > MAX_SKILL_SELECTIONS
        ? `Selecione no maximo ${MAX_SKILL_SELECTIONS} hard skills profissionais.`
        : ""
  const softSkillError =
    touched.softSkillsProfissionais && formData.softSkillsProfissionais.length === 0
      ? "Selecione ao menos uma soft skill profissional."
      : touched.softSkillsProfissionais && formData.softSkillsProfissionais.length > MAX_SKILL_SELECTIONS
        ? `Selecione no maximo ${MAX_SKILL_SELECTIONS} soft skills profissionais.`
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
        seniorities,
        benefits,
        softSkills,
        languages,
        proficiencies,
      ] = await Promise.all([
        fetchExperienceOptions(),
        fetchSeniorityOptions(),
        fetchCurrentBenefitOptions(),
        fetchSoftSkillOptions(),
        fetchLanguageOptions(),
        fetchLanguageProficiencyOptions(),
      ])

      if (isMounted) {
        setExperienceOptions(experiences)
        setSeniorityOptions(seniorities)
        setBenefitOptions(benefits)
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

  useEffect(() => {
    if (industryOptions.length === 0) {
      return
    }

    const allowedValues = new Set(hardSkillOptions.map((option) => option.value))
    setFormData((previous) => ({
      ...previous,
      hardSkillsProfissionais: previous.hardSkillsProfissionais.filter((value) => allowedValues.has(value)),
    }))
  }, [hardSkillOptions, industryOptions.length])

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

  const addRecommendation = () => {
    setFormData((previous) => ({
      ...previous,
      indicacoes: [...previous.indicacoes, createEmptyRecommendation()],
    }))
  }

  const removeRecommendation = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      indicacoes: previous.indicacoes.filter((_, currentIndex) => currentIndex !== index),
    }))
    setTouched((previous) => ({ ...previous, indicacoes: [] }))
  }

  const updateRecommendation = (
    index: number,
    field: "nome" | "telefone" | "cargo",
    value: string,
  ) => {
    setFormData((previous) => ({
      ...previous,
      indicacoes: previous.indicacoes.map((recommendation, currentIndex) =>
        currentIndex === index
          ? { ...recommendation, [field]: field === "telefone" ? value.replace(/\D/g, "").slice(0, 11) : value }
          : recommendation,
      ),
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isFormComplete) {
      setTouched({
        experiencia: true,
        salarioAtual: true,
        empresaAtual: true,
        indicacoes: formData.indicacoes.map((_, index) => index),
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
    onUpdate({
      ...formData,
      indicacao: undefined,
      indicacoes: formData.indicacoes
        .filter(hasRecommendationData)
        .map((recommendation) => ({
          nome: recommendation.nome.trim(),
          telefone: recommendation.telefone,
          cargo: recommendation.cargo.trim(),
        })),
    })
    onNext()
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Experiência Profissional</h2>
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
              maxSelections={MAX_AREA_SELECTIONS}
              options={industryOptions}
              placeholder="Selecione uma area"
              value={formData.industriaInteresse}
              onChange={(value) => {
                const allowedValues = new Set(getHardSkillOptionsForAreas(value, industryOptions).map((option) => option.value))
                setFormData((previous) => ({
                  ...previous,
                  industriaInteresse: value,
                  timeAtual: normalizeTeamValueForAreas(previous.timeAtual, value, industryOptions),
                  hardSkillsProfissionais: previous.hardSkillsProfissionais.filter((skill) => allowedValues.has(skill)),
                }))
                if (!touched.industriaInteresse) {
                  setTouched((previous) => ({ ...previous, industriaInteresse: true }))
                }
              }}
            />
            {areaError ? <p className="text-xs text-destructive">{areaError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeAtual">Time</Label>
            <MultiSelect
              id="timeAtual"
              maxSelections={MAX_TEAM_SELECTIONS}
              options={teamOptions}
              disabled={teamOptions.length === 0}
              placeholder={
                formData.industriaInteresse.length === 0
                  ? "Selecione uma area primeiro"
                  : `Selecione ate ${MAX_TEAM_SELECTIONS} times`
              }
              value={formData.timeAtual}
              onChange={(value) => {
                setFormData({ ...formData, timeAtual: value })
                if (!touched.timeAtual) {
                  setTouched((previous) => ({ ...previous, timeAtual: true }))
                }
              }}
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
              maxSelections={MAX_SKILL_SELECTIONS}
              options={hardSkillOptions}
              placeholder={formData.industriaInteresse.length > 0 ? `Selecione ate ${MAX_SKILL_SELECTIONS} hard skills` : "Selecione uma area primeiro"}
              disabled={hardSkillOptions.length === 0}
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
              maxSelections={MAX_SKILL_SELECTIONS}
              options={softSkillOptions}
              placeholder={`Selecione ate ${MAX_SKILL_SELECTIONS} soft skills`}
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

        <section className="space-y-4 rounded-[1.5rem] border border-slate-200 p-5" aria-labelledby="indicacoes-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 id="indicacoes-title" className="text-base font-semibold text-slate-950">Indicações e recomendações (opcional)</h3>
              <p className="mt-1 text-sm text-slate-500">Adicione pessoas que possam recomendar seu perfil. Você pode deixar este campo em branco.</p>
            </div>
            <Button type="button" variant="outline" onClick={addRecommendation} className="shrink-0 rounded-full bg-transparent">
              <Plus className="mr-2 size-4" />
              Adicionar indicação
            </Button>
          </div>

          {formData.indicacoes.map((recommendation, index) => {
            const errors = recommendationErrors[index]
            const idPrefix = `indicacao-${index}`
            return (
              <div key={index} className="space-y-4 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-700">Indicação {index + 1}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeRecommendation(index)}
                    className="rounded-full bg-transparent"
                    aria-label={`Remover indicação ${index + 1}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="sr-only">Remover indicação</span>
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-nome`}>Nome</Label>
                    <Input
                      id={`${idPrefix}-nome`}
                      value={recommendation.nome}
                      onChange={(event) => updateRecommendation(index, "nome", event.target.value)}
                      onBlur={() => setTouched((previous) => ({
                        ...previous,
                        indicacoes: previous.indicacoes.includes(index) ? previous.indicacoes : [...previous.indicacoes, index],
                      }))}
                      className={cn(errors.name && "border-destructive focus-visible:ring-destructive/40")}
                      aria-invalid={errors.name ? "true" : "false"}
                      aria-describedby={errors.name ? `${idPrefix}-nome-error` : undefined}
                      autoComplete="name"
                    />
                    {errors.name ? <p id={`${idPrefix}-nome-error`} className="text-xs text-destructive">{errors.name}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-telefone`}>Telefone</Label>
                    <Input
                      id={`${idPrefix}-telefone`}
                      inputMode="numeric"
                      value={recommendation.telefone}
                      onChange={(event) => updateRecommendation(index, "telefone", event.target.value)}
                      onBlur={() => setTouched((previous) => ({
                        ...previous,
                        indicacoes: previous.indicacoes.includes(index) ? previous.indicacoes : [...previous.indicacoes, index],
                      }))}
                      className={cn(errors.phone && "border-destructive focus-visible:ring-destructive/40")}
                      aria-invalid={errors.phone ? "true" : "false"}
                      aria-describedby={errors.phone ? `${idPrefix}-telefone-error` : undefined}
                      autoComplete="tel"
                    />
                    {errors.phone ? <p id={`${idPrefix}-telefone-error`} className="text-xs text-destructive">{errors.phone}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${idPrefix}-cargo`}>Cargo</Label>
                    <Input
                      id={`${idPrefix}-cargo`}
                      value={recommendation.cargo}
                      onChange={(event) => updateRecommendation(index, "cargo", event.target.value)}
                      onBlur={() => setTouched((previous) => ({
                        ...previous,
                        indicacoes: previous.indicacoes.includes(index) ? previous.indicacoes : [...previous.indicacoes, index],
                      }))}
                      className={cn(errors.role && "border-destructive focus-visible:ring-destructive/40")}
                      aria-invalid={errors.role ? "true" : "false"}
                      aria-describedby={errors.role ? `${idPrefix}-cargo-error` : undefined}
                    />
                    {errors.role ? <p id={`${idPrefix}-cargo-error`} className="text-xs text-destructive">{errors.role}</p> : null}
                  </div>
                </div>
              </div>
            )
          })}
        </section>

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
