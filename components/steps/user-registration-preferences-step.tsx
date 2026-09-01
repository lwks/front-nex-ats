"use client"

import type React from "react"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { AreaOptionsStatus } from "@/components/area-options-status"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultContractTypeOptions,
  defaultHardSkillOptions,
  defaultSeniorityOptions,
  defaultSoftSkillOptions,
  defaultTravelAvailabilityOptions,
  defaultWorkTypeOptions,
  topSectorOptions,
  type OnboardingOption,
  type TravelAvailabilityOption,
} from "@/lib/onboarding-options"
import { cn } from "@/lib/utils"
import { getCompetencyOptionsForAreas } from "@/services/areas-service"
import {
  fetchContractTypeOptions,
  fetchHardSkillOptions,
  fetchSeniorityOptions,
  fetchSoftSkillOptions,
  fetchTravelAvailabilityOptions,
  fetchWorkTypeOptions,
} from "@/services/onboarding-options-service"
import type { UserRegistrationData } from "@/services/user-registration-service"
import { useAreaOptions } from "@/hooks/use-area-options"

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

type UserRegistrationPreferencesStepProps = {
  data: Partial<UserRegistrationData>
  onBack: () => void
  onNext: () => void
  onUpdate: (data: Partial<UserRegistrationData>) => void
}

export function UserRegistrationPreferencesStep({
  data,
  onBack,
  onNext,
  onUpdate,
}: UserRegistrationPreferencesStepProps) {
  const [formData, setFormData] = useState({
    setor: data.setor || "",
    time: data.time || "",
    senioridadePreferencia: data.senioridadePreferencia || "",
    areaPreferencia: data.areaPreferencia || [],
    tipoContratacao: data.tipoContratacao || [],
    modeloTrabalho: data.modeloTrabalho || [],
    hardSkills: data.hardSkills || [],
    softSkills: data.softSkills || [],
    viagemTrabalho: data.viagemTrabalho || "",
    pretensaoSalarial: data.pretensaoSalarial || "",
    sobreVoce: data.sobreVoce || "",
    mensagemEmpresa: data.mensagemEmpresa || "",
    compartilhamentoAccepted: data.compartilhamentoAccepted || false,
  })
  const [touched, setTouched] = useState({
    setor: false,
    time: false,
    senioridadePreferencia: false,
    areaPreferencia: false,
    tipoContratacao: false,
    modeloTrabalho: false,
    hardSkills: false,
    softSkills: false,
    viagemTrabalho: false,
    pretensaoSalarial: false,
    sobreVoce: false,
    compartilhamentoAccepted: false,
  })
  const [workTypeOptions, setWorkTypeOptions] = useState<OnboardingOption[]>(defaultWorkTypeOptions)
  const [contractTypeOptions, setContractTypeOptions] = useState<OnboardingOption[]>(defaultContractTypeOptions)
  const { options: industryOptions, source: areaOptionsSource, error: areaOptionsError, isLoading: isAreaOptionsLoading, reload: reloadAreaOptions } = useAreaOptions()
  const teamOptions = getCompetencyOptionsForAreas(formData.areaPreferencia, industryOptions)
  const [seniorityOptions, setSeniorityOptions] = useState<OnboardingOption[]>(defaultSeniorityOptions)
  const [hardSkillOptions, setHardSkillOptions] = useState<OnboardingOption[]>(defaultHardSkillOptions)
  const [softSkillOptions, setSoftSkillOptions] = useState<OnboardingOption[]>(defaultSoftSkillOptions)
  const [travelOptions, setTravelOptions] = useState<TravelAvailabilityOption[]>(defaultTravelAvailabilityOptions)

  const isFormComplete =
    Boolean(formData.setor.trim()) &&
    Boolean(formData.time.trim()) &&
    Boolean(formData.senioridadePreferencia) &&
    formData.areaPreferencia.length > 0 &&
    formData.areaPreferencia.length <= 3 &&
    formData.tipoContratacao.length > 0 &&
    formData.modeloTrabalho.length > 0 &&
    formData.hardSkills.length > 0 &&
    formData.hardSkills.length <= 7 &&
    formData.softSkills.length > 0 &&
    formData.softSkills.length <= 7 &&
    Boolean(formData.viagemTrabalho) &&
    Boolean(formData.pretensaoSalarial.trim()) &&
    Boolean(formData.sobreVoce.trim()) &&
    formData.compartilhamentoAccepted

  const contractError =
    touched.tipoContratacao && formData.tipoContratacao.length === 0
      ? "Selecione ao menos um tipo de contratacao."
      : ""
  const sectorError = touched.setor && !formData.setor.trim() ? "Informe o setor." : ""
  const teamError = touched.time && !formData.time.trim() ? "Informe o time." : ""
  const seniorityPreferenceError =
    touched.senioridadePreferencia && !formData.senioridadePreferencia
      ? "Selecione a senioridade de preferencia."
      : ""
  const preferenceAreaError =
    touched.areaPreferencia && formData.areaPreferencia.length === 0
      ? "Selecione ao menos uma area de preferencia."
      : touched.areaPreferencia && formData.areaPreferencia.length > 3
        ? "Selecione no maximo 3 areas de preferencia."
        : ""
  const workTypeError =
    touched.modeloTrabalho && formData.modeloTrabalho.length === 0 ? "Selecione ao menos um modelo de trabalho." : ""
  const hardSkillError =
    touched.hardSkills && formData.hardSkills.length === 0
      ? "Selecione ao menos uma hard skill."
      : touched.hardSkills && formData.hardSkills.length > 7
        ? "Selecione no maximo 7 hard skills."
        : ""
  const softSkillError =
    touched.softSkills && formData.softSkills.length === 0
      ? "Selecione ao menos uma soft skill."
      : touched.softSkills && formData.softSkills.length > 7
        ? "Selecione no maximo 7 soft skills."
        : ""
  const travelError =
    touched.viagemTrabalho && !formData.viagemTrabalho ? "Selecione a disponibilidade para viagem de trabalho." : ""
  const salaryError =
    touched.pretensaoSalarial && !formData.pretensaoSalarial.trim() ? "Informe a pretensao salarial." : ""
  const summaryError = touched.sobreVoce && !formData.sobreVoce.trim() ? "Conte um pouco sobre voce." : ""
  const shareError =
    touched.compartilhamentoAccepted && !formData.compartilhamentoAccepted
      ? "Confirme o compartilhamento de dados."
      : ""

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [workTypes, contractTypes, seniorities, hardSkills, softSkills, travel] = await Promise.all([
        fetchWorkTypeOptions(),
        fetchContractTypeOptions(),
        fetchSeniorityOptions(),
        fetchHardSkillOptions(),
        fetchSoftSkillOptions(),
        fetchTravelAvailabilityOptions(),
      ])

      if (isMounted) {
        setWorkTypeOptions(workTypes)
        setContractTypeOptions(contractTypes)
        setSeniorityOptions(seniorities)
        setHardSkillOptions(hardSkills)
        setSoftSkillOptions(softSkills)
        setTravelOptions(travel)
      }
    }

    loadOptions().catch((error) => console.error("Failed to load registration preference options", error))

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isFormComplete) {
      setTouched({
        setor: true,
        time: true,
        senioridadePreferencia: true,
        areaPreferencia: true,
        tipoContratacao: true,
        modeloTrabalho: true,
        hardSkills: true,
        softSkills: true,
        viagemTrabalho: true,
        pretensaoSalarial: true,
        sobreVoce: true,
        compartilhamentoAccepted: true,
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
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Preferencias e Perfil</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Defina seus modelos de trabalho, habilidades, disponibilidade e sua apresentacao para a empresa.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="areaPreferencia">Area</Label>
            <MultiSelect
              id="areaPreferencia"
              maxSelections={3}
              options={industryOptions}
              placeholder="Selecione ate 3 areas"
              value={formData.areaPreferencia}
              onChange={(value) => {
                const nextTeamOptions = getCompetencyOptionsForAreas(value, industryOptions)
                setFormData({
                  ...formData,
                  areaPreferencia: value,
                  time: nextTeamOptions.some((option) => option.value === formData.time) ? formData.time : "",
                })
                if (!touched.areaPreferencia) {
                  setTouched((previous) => ({ ...previous, areaPreferencia: true }))
                }
              }}
            />
            <AreaOptionsStatus
              error={areaOptionsError}
              isLoading={isAreaOptionsLoading}
              onReload={() => void reloadAreaOptions()}
              options={industryOptions}
              source={areaOptionsSource}
            />
            {preferenceAreaError ? <p className="text-xs text-destructive">{preferenceAreaError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="setor">Setor</Label>
            <Select
              value={formData.setor}
              onValueChange={(value) => {
                setFormData({ ...formData, setor: value })
                if (!touched.setor) {
                  setTouched((previous) => ({ ...previous, setor: true }))
                }
              }}
            >
              <SelectTrigger
                id="setor"
                className={cn("w-full", sectorError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={sectorError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione o setor" />
              </SelectTrigger>
              <SelectContent>
                {topSectorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {sectorError ? <p className="text-xs text-destructive">{sectorError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time</Label>
            <Select
              value={formData.time}
              onValueChange={(value) => {
                setFormData({ ...formData, time: value })
                if (!touched.time) {
                  setTouched((previous) => ({ ...previous, time: true }))
                }
              }}
            >
              <SelectTrigger
                id="time"
                disabled={isAreaOptionsLoading || (teamOptions.length === 0 && !formData.time)}
                className={cn("w-full", teamError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={teamError ? "true" : "false"}
              >
                <SelectValue
                  placeholder={
                    isAreaOptionsLoading
                      ? "Carregando times..."
                      : teamOptions.length > 0
                        ? "Selecione o time"
                        : "Selecione uma area primeiro"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {teamOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {teamError ? <p className="text-xs text-destructive">{teamError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senioridadePreferencia">Senioridade</Label>
            <Select
              value={formData.senioridadePreferencia}
              onValueChange={(value) => {
                setFormData({ ...formData, senioridadePreferencia: value })
                if (!touched.senioridadePreferencia) {
                  setTouched((previous) => ({ ...previous, senioridadePreferencia: true }))
                }
              }}
            >
              <SelectTrigger
                id="senioridadePreferencia"
                className={cn("w-full", seniorityPreferenceError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={seniorityPreferenceError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione a senioridade" />
              </SelectTrigger>
              <SelectContent>
                {seniorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {seniorityPreferenceError ? <p className="text-xs text-destructive">{seniorityPreferenceError}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipoContratacao">Modelo de contrato</Label>
            <MultiSelect
              id="tipoContratacao"
              options={contractTypeOptions}
              placeholder="Selecione um ou mais modelos"
              value={formData.tipoContratacao}
              onChange={(value) => {
                setFormData({ ...formData, tipoContratacao: value })
                if (!touched.tipoContratacao) {
                  setTouched((previous) => ({ ...previous, tipoContratacao: true }))
                }
              }}
            />
            {contractError ? <p className="text-xs text-destructive">{contractError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="modeloTrabalho">Modelo de trabalho</Label>
            <MultiSelect
              id="modeloTrabalho"
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
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="viagemTrabalho">Viagem de trabalho</Label>
            <Select
              value={formData.viagemTrabalho}
              onValueChange={(value) => {
                setFormData({ ...formData, viagemTrabalho: value })
                if (!touched.viagemTrabalho) {
                  setTouched((previous) => ({ ...previous, viagemTrabalho: true }))
                }
              }}
            >
              <SelectTrigger
                id="viagemTrabalho"
                className={cn("w-full", travelError && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={travelError ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione a disponibilidade para viagem" />
              </SelectTrigger>
              <SelectContent>
                {travelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {travelError ? <p className="text-xs text-destructive">{travelError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pretensaoSalarial">Pretensao salarial</Label>
            <Input
              id="pretensaoSalarial"
              inputMode="numeric"
              value={formData.pretensaoSalarial}
              onChange={(event) =>
                setFormData({ ...formData, pretensaoSalarial: formatCurrencyInput(event.target.value) })
              }
              onBlur={() => {
                if (!touched.pretensaoSalarial) {
                  setTouched((previous) => ({ ...previous, pretensaoSalarial: true }))
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
            <Label htmlFor="hardSkills">Hard Skills</Label>
            <MultiSelect
              id="hardSkills"
              maxSelections={7}
              options={hardSkillOptions}
              placeholder="Selecione ate 7 hard skills"
              value={formData.hardSkills}
              onChange={(value) => {
                setFormData({ ...formData, hardSkills: value })
                if (!touched.hardSkills) {
                  setTouched((previous) => ({ ...previous, hardSkills: true }))
                }
              }}
            />
            {hardSkillError ? <p className="text-xs text-destructive">{hardSkillError}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="softSkills">Soft Skills</Label>
            <MultiSelect
              id="softSkills"
              maxSelections={7}
              options={softSkillOptions}
              placeholder="Selecione ate 7 soft skills"
              value={formData.softSkills}
              onChange={(value) => {
                setFormData({ ...formData, softSkills: value })
                if (!touched.softSkills) {
                  setTouched((previous) => ({ ...previous, softSkills: true }))
                }
              }}
            />
            {softSkillError ? <p className="text-xs text-destructive">{softSkillError}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sobreVoce">Conte um pouco sobre você</Label>
          <textarea
            id="sobreVoce"
            value={formData.sobreVoce}
            onChange={(event) => setFormData({ ...formData, sobreVoce: event.target.value })}
            onBlur={() => {
              if (!touched.sobreVoce) {
                setTouched((previous) => ({ ...previous, sobreVoce: true }))
              }
            }}
            className={cn(
              "border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]",
              summaryError && "border-destructive focus-visible:ring-destructive/40",
            )}
            aria-invalid={summaryError ? "true" : "false"}
          />
          {summaryError ? <p className="text-xs text-destructive">{summaryError}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemEmpresa">Mensagem para empresa/gestor</Label>
          <textarea
            id="mensagemEmpresa"
            value={formData.mensagemEmpresa}
            onChange={(event) => setFormData({ ...formData, mensagemEmpresa: event.target.value })}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          />
        </div>

        <div
          className={cn(
            "flex items-start gap-4 rounded-xl border-2 p-4 transition",
            formData.compartilhamentoAccepted
              ? "border-[#FF6B00] bg-orange-50"
              : "border-slate-300 bg-white shadow-sm",
          )}
        >
          <Checkbox
            id="compartilhamentoAccepted"
            checked={formData.compartilhamentoAccepted}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, compartilhamentoAccepted: checked === true })
              if (!touched.compartilhamentoAccepted) {
                setTouched((previous) => ({ ...previous, compartilhamentoAccepted: true }))
              }
            }}
            className="mt-0.5 size-5 border-2 border-[#FF6B00] data-[state=checked]:border-[#FF6B00] data-[state=checked]:bg-[#FF6B00]"
          />
          <div className="space-y-1">
            <Label htmlFor="compartilhamentoAccepted" className="text-sm font-semibold text-slate-950">
              Autorizo o compartilhamento dos meus dados de perfil
            </Label>
            <p className="text-xs leading-5 text-slate-500">
              A plataforma podera usar essas informacoes para montar minha experiencia inicial de uso.
            </p>
            {shareError ? <p className="text-xs text-destructive">{shareError}</p> : null}
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
