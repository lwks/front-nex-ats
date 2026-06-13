"use client"

import type React from "react"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultContractTypeOptions,
  defaultCurrentBenefitOptions,
  defaultIndustryOptions,
  defaultLanguageOptions,
  defaultProfessionalSkillOptions,
  defaultWorkTypeOptions,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import {
  fetchContractTypeOptions,
  fetchCurrentBenefitOptions,
  fetchIndustryOptions,
  fetchLanguageOptions,
  fetchProfessionalSkillOptions,
  fetchWorkTypeOptions,
} from "@/services/onboarding-options-service"
import type { UserRegistrationData } from "@/services/user-registration-service"
import { cn } from "@/lib/utils"

type UserRegistrationPreferencesStepProps = {
  data: Partial<UserRegistrationData>
  isSubmitting: boolean
  onBack: () => void
  onSubmit: (finalData: Partial<UserRegistrationData>) => void
  onUpdate: (data: Partial<UserRegistrationData>) => void
}

export function UserRegistrationPreferencesStep({
  data,
  isSubmitting,
  onBack,
  onSubmit,
  onUpdate,
}: UserRegistrationPreferencesStepProps) {
  const [formData, setFormData] = useState({
    industriaInteresse: data.industriaInteresse || "",
    cargoInteresse: data.cargoInteresse || "",
    tipoContratacao: data.tipoContratacao || "",
    modeloTrabalho: data.modeloTrabalho || [],
    idiomas: data.idiomas || [],
    skillsProfissionais: data.skillsProfissionais || [],
    beneficiosAtuais: data.beneficiosAtuais || [],
    compartilhamentoAccepted: data.compartilhamentoAccepted || false,
  })
  const [touched, setTouched] = useState({
    industriaInteresse: false,
    cargoInteresse: false,
    tipoContratacao: false,
    modeloTrabalho: false,
    idiomas: false,
    skillsProfissionais: false,
    beneficiosAtuais: false,
    compartilhamentoAccepted: false,
  })
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)
  const [workTypeOptions, setWorkTypeOptions] = useState<OnboardingOption[]>(defaultWorkTypeOptions)
  const [contractTypeOptions, setContractTypeOptions] = useState<OnboardingOption[]>(defaultContractTypeOptions)
  const [languageOptions, setLanguageOptions] = useState<OnboardingOption[]>(defaultLanguageOptions)
  const [skillOptions, setSkillOptions] = useState<OnboardingOption[]>(defaultProfessionalSkillOptions)
  const [benefitOptions, setBenefitOptions] = useState<OnboardingOption[]>(defaultCurrentBenefitOptions)

  const isFormComplete =
    Boolean(formData.industriaInteresse) &&
    Boolean(formData.cargoInteresse.trim()) &&
    Boolean(formData.tipoContratacao) &&
    formData.modeloTrabalho.length > 0 &&
    formData.idiomas.length > 0 &&
    formData.skillsProfissionais.length > 0 &&
    formData.beneficiosAtuais.length > 0 &&
    formData.compartilhamentoAccepted

  const industryError =
    touched.industriaInteresse && !formData.industriaInteresse ? "Selecione a industria de interesse." : ""
  const roleError =
    touched.cargoInteresse && !formData.cargoInteresse.trim() ? "Informe o cargo de interesse." : ""
  const contractError =
    touched.tipoContratacao && !formData.tipoContratacao ? "Selecione o tipo de contratacao." : ""
  const workTypeError =
    touched.modeloTrabalho && formData.modeloTrabalho.length === 0 ? "Selecione ao menos um modelo de trabalho." : ""
  const languageError =
    touched.idiomas && formData.idiomas.length === 0 ? "Selecione ao menos um idioma." : ""
  const skillError =
    touched.skillsProfissionais && formData.skillsProfissionais.length === 0
      ? "Selecione ao menos uma skill profissional."
      : ""
  const benefitError =
    touched.beneficiosAtuais && formData.beneficiosAtuais.length === 0
      ? "Selecione ao menos um beneficio atual."
      : ""
  const shareError =
    touched.compartilhamentoAccepted && !formData.compartilhamentoAccepted
      ? "Confirme o compartilhamento de dados."
      : ""

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [industries, workTypes, contractTypes, languages, skills, benefits] = await Promise.all([
        fetchIndustryOptions(),
        fetchWorkTypeOptions(),
        fetchContractTypeOptions(),
        fetchLanguageOptions(),
        fetchProfessionalSkillOptions(),
        fetchCurrentBenefitOptions(),
      ])

      if (isMounted) {
        setIndustryOptions(industries)
        setWorkTypeOptions(workTypes)
        setContractTypeOptions(contractTypes)
        setLanguageOptions(languages)
        setSkillOptions(skills)
        setBenefitOptions(benefits)
      }
    }

    loadOptions().catch((error) => console.error("Failed to load registration preference options", error))

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (isSubmitting || !isFormComplete) {
      return
    }
    onUpdate(formData)
    onSubmit(formData)
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Preferencias e perfil</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Defina interesses, idiomas, skills e beneficios para completar seu cadastro.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="industriaInteresse">Industria de interesse</Label>
            <Select
              disabled={isSubmitting}
              value={formData.industriaInteresse}
              onValueChange={(value) => {
                setFormData({ ...formData, industriaInteresse: value })
                if (!touched.industriaInteresse) {
                  setTouched((previous) => ({ ...previous, industriaInteresse: true }))
                }
              }}
            >
              <SelectTrigger
                id="industriaInteresse"
                className={cn("w-full", industryError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={industryError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione a industria de interesse" />
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

          <div className="space-y-2">
            <Label htmlFor="cargoInteresse">Cargo de interesse</Label>
            <Input
              id="cargoInteresse"
              disabled={isSubmitting}
              value={formData.cargoInteresse}
              onChange={(event) => setFormData({ ...formData, cargoInteresse: event.target.value })}
              onBlur={() => {
                if (!touched.cargoInteresse) {
                  setTouched((previous) => ({ ...previous, cargoInteresse: true }))
                }
              }}
              className={cn(roleError && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={roleError ? "true" : "false"}
            />
            {roleError ? <p className="text-xs text-destructive">{roleError}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoContratacao">Tipo de contratacao</Label>
          <Select
            disabled={isSubmitting}
            value={formData.tipoContratacao}
            onValueChange={(value) => {
              setFormData({ ...formData, tipoContratacao: value })
              if (!touched.tipoContratacao) {
                setTouched((previous) => ({ ...previous, tipoContratacao: true }))
              }
            }}
          >
            <SelectTrigger
              id="tipoContratacao"
              className={cn("w-full", contractError && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={contractError ? "true" : "false"}
            >
              <SelectValue placeholder="Selecione o tipo de contratacao" />
            </SelectTrigger>
            <SelectContent>
              {contractTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contractError ? <p className="text-xs text-destructive">{contractError}</p> : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="modeloTrabalho">Modelo de trabalho</Label>
            <MultiSelect
              id="modeloTrabalho"
              disabled={isSubmitting}
              options={workTypeOptions}
              placeholder="Selecione um ou mais modelos"
              value={formData.modeloTrabalho}
              onChange={(value) => {
                setFormData({ ...formData, modeloTrabalho: value })
                if (!touched.modeloTrabalho) {
                  setTouched((previous) => ({ ...previous, modeloTrabalho: true }))
                }
              }}
            />
            {workTypeError ? <p className="text-xs text-destructive">{workTypeError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="idiomas">Idiomas</Label>
            <MultiSelect
              id="idiomas"
              disabled={isSubmitting}
              options={languageOptions}
              placeholder="Selecione um ou mais idiomas"
              value={formData.idiomas}
              onChange={(value) => {
                setFormData({ ...formData, idiomas: value })
                if (!touched.idiomas) {
                  setTouched((previous) => ({ ...previous, idiomas: true }))
                }
              }}
            />
            {languageError ? <p className="text-xs text-destructive">{languageError}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="skillsProfissionais">Skills profissionais</Label>
            <MultiSelect
              id="skillsProfissionais"
              disabled={isSubmitting}
              options={skillOptions}
              placeholder="Selecione suas skills"
              value={formData.skillsProfissionais}
              onChange={(value) => {
                setFormData({ ...formData, skillsProfissionais: value })
                if (!touched.skillsProfissionais) {
                  setTouched((previous) => ({ ...previous, skillsProfissionais: true }))
                }
              }}
            />
            {skillError ? <p className="text-xs text-destructive">{skillError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiosAtuais">Beneficios atuais</Label>
            <MultiSelect
              id="beneficiosAtuais"
              disabled={isSubmitting}
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

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox
            id="compartilhamentoAccepted"
            disabled={isSubmitting}
            checked={formData.compartilhamentoAccepted}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, compartilhamentoAccepted: checked === true })
              if (!touched.compartilhamentoAccepted) {
                setTouched((previous) => ({ ...previous, compartilhamentoAccepted: true }))
              }
            }}
          />
          <div className="space-y-1">
            <Label htmlFor="compartilhamentoAccepted">Autorizo o compartilhamento dos meus dados de perfil</Label>
            <p className="text-xs leading-5 text-slate-500">
              A plataforma podera usar essas informacoes para montar minha experiencia inicial de uso.
            </p>
            {shareError ? <p className="text-xs text-destructive">{shareError}</p> : null}
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 rounded-full bg-transparent"
            size="lg"
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]"
            size="lg"
            disabled={isSubmitting || !isFormComplete}
          >
            {isSubmitting ? "Finalizando..." : "Finalizar cadastro"}
          </Button>
        </div>
      </form>
    </div>
  )
}
