"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CandidateData } from "../candidate-onboarding"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  defaultContractTypeOptions,
  defaultIndustryOptions,
  defaultWorkTypeOptions,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import {
  fetchContractTypeOptions,
  fetchIndustryOptions,
  fetchWorkTypeOptions,
} from "@/services/onboarding-options-service"

interface ProfessionalInterestsStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onSubmit: (finalData: Partial<CandidateData>) => void
  onBack: () => void
  isSubmitting: boolean
}

export function ProfessionalInterestsStep({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: ProfessionalInterestsStepProps) {
  const [formData, setFormData] = useState({
    industriaInteresse: data.industriaInteresse || "",
    cargoInteresseDetalhado: data.cargoInteresseDetalhado || "",
    tipoTrabalho: data.tipoTrabalho || "",
    tipoContratacao: data.tipoContratacao || "",
    compartilhamentoAccepted: data.compartilhamentoAccepted || false,
  })
  const [touched, setTouched] = useState({
    industriaInteresse: false,
    cargoInteresseDetalhado: false,
    tipoTrabalho: false,
    tipoContratacao: false,
    compartilhamentoAccepted: false,
  })
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)
  const [workTypeOptions, setWorkTypeOptions] = useState<OnboardingOption[]>(defaultWorkTypeOptions)
  const [contractTypeOptions, setContractTypeOptions] = useState<OnboardingOption[]>(defaultContractTypeOptions)
  const isFormComplete =
    Boolean(formData.industriaInteresse) &&
    Boolean(formData.cargoInteresseDetalhado.trim()) &&
    Boolean(formData.tipoTrabalho) &&
    Boolean(formData.tipoContratacao) &&
    formData.compartilhamentoAccepted
  const industryError =
    touched.industriaInteresse && !formData.industriaInteresse ? "Selecione a indústria de interesse." : ""
  const roleError =
    touched.cargoInteresseDetalhado && !formData.cargoInteresseDetalhado.trim()
      ? "Informe o cargo de interesse."
      : ""
  const workTypeError =
    touched.tipoTrabalho && !formData.tipoTrabalho ? "Selecione o tipo de trabalho." : ""
  const contractError =
    touched.tipoContratacao && !formData.tipoContratacao ? "Selecione o tipo de contratação." : ""
  const shareError =
    touched.compartilhamentoAccepted && !formData.compartilhamentoAccepted
      ? "Confirme o compartilhamento de dados."
      : ""

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [industries, workTypes, contractTypes] = await Promise.all([
        fetchIndustryOptions(),
        fetchWorkTypeOptions(),
        fetchContractTypeOptions(),
      ])

      if (isMounted) {
        setIndustryOptions(industries)
        setWorkTypeOptions(workTypes)
        setContractTypeOptions(contractTypes)
      }
    }

    loadOptions().catch((error) => console.error("Failed to load professional interest options", error))

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) {
      return
    }
    if (!isFormComplete) {
      return
    }
    if (!formData.compartilhamentoAccepted) {
      alert("Por favor, confirme o compartilhamento de dados para continuar.")
      return
    }
    onUpdate(formData)
    onSubmit(formData)
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Interesses Profissionais</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="industriaInteresse">Indústria de Interesse</Label>
          <Select
            disabled={isSubmitting}
            value={formData.industriaInteresse}
            onValueChange={(value) => {
              setFormData({ ...formData, industriaInteresse: value })
              if (!touched.industriaInteresse) {
                setTouched((previous) => ({ ...previous, industriaInteresse: true }))
              }
            }}
            required
          >
            <SelectTrigger
              className={industryError ? "bg-input border-destructive focus-visible:ring-destructive/40" : "bg-input"}
              aria-invalid={industryError ? "true" : "false"}
              onBlur={() => {
                if (!touched.industriaInteresse) {
                  setTouched((previous) => ({ ...previous, industriaInteresse: true }))
                }
              }}
            >
              <SelectValue placeholder="Selecione a indústria de interesse" />
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
          <Label htmlFor="cargoInteresseDetalhado">Cargo de Interesse</Label>
          <Input
            disabled={isSubmitting}
            id="cargoInteresseDetalhado"
            type="text"
            placeholder="Ex: Gerente de Projetos"
            value={formData.cargoInteresseDetalhado}
            onChange={(e) => setFormData({ ...formData, cargoInteresseDetalhado: e.target.value })}
            onBlur={() => {
              if (!touched.cargoInteresseDetalhado) {
                setTouched((previous) => ({ ...previous, cargoInteresseDetalhado: true }))
              }
            }}
            required
            className={
              roleError ? "bg-input border-destructive focus-visible:ring-destructive/40" : "bg-input"
            }
            aria-invalid={roleError ? "true" : "false"}
          />
          {roleError ? <p className="text-xs text-destructive">{roleError}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoTrabalho">Tipo de Trabalho</Label>
          <Select
            disabled={isSubmitting}
            value={formData.tipoTrabalho}
            onValueChange={(value) => {
              setFormData({ ...formData, tipoTrabalho: value })
              if (!touched.tipoTrabalho) {
                setTouched((previous) => ({ ...previous, tipoTrabalho: true }))
              }
            }}
            required
          >
            <SelectTrigger
              className={workTypeError ? "bg-input border-destructive focus-visible:ring-destructive/40" : "bg-input"}
              aria-invalid={workTypeError ? "true" : "false"}
              onBlur={() => {
                if (!touched.tipoTrabalho) {
                  setTouched((previous) => ({ ...previous, tipoTrabalho: true }))
                }
              }}
            >
              <SelectValue placeholder="Selecione o tipo de trabalho" />
            </SelectTrigger>
            <SelectContent>
              {workTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {workTypeError ? <p className="text-xs text-destructive">{workTypeError}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoContratacao">Tipo de Contratação</Label>
          <Select
            disabled={isSubmitting}
            value={formData.tipoContratacao}
            onValueChange={(value) => {
              setFormData({ ...formData, tipoContratacao: value })
              if (!touched.tipoContratacao) {
                setTouched((previous) => ({ ...previous, tipoContratacao: true }))
              }
            }}
            required
          >
            <SelectTrigger
              className={contractError ? "bg-input border-destructive focus-visible:ring-destructive/40" : "bg-input"}
              aria-invalid={contractError ? "true" : "false"}
              onBlur={() => {
                if (!touched.tipoContratacao) {
                  setTouched((previous) => ({ ...previous, tipoContratacao: true }))
                }
              }}
            >
              <SelectValue placeholder="Selecione o tipo de contratação" />
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

        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="compartilhamento"
            disabled={isSubmitting}
            checked={formData.compartilhamentoAccepted}
            onCheckedChange={(checked) => {
              setFormData({ ...formData, compartilhamentoAccepted: checked as boolean })
              if (!touched.compartilhamentoAccepted) {
                setTouched((previous) => ({ ...previous, compartilhamentoAccepted: true }))
              }
            }}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="compartilhamento" className="text-sm font-normal cursor-pointer">
              Confirmação de Compartilhamento
            </Label>
            <p className="text-xs text-muted-foreground">
              Autorizo o compartilhamento dos meus dados profissionais com empresas parceiras da plataforma NexJob para
              fins de recrutamento e seleção
            </p>
            {shareError ? <p className="text-xs text-destructive">{shareError}</p> : null}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1 bg-transparent"
            size="lg"
            disabled={isSubmitting}
          >
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            size="lg"
            disabled={isSubmitting || !isFormComplete}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Processando...
              </span>
            ) : (
              "Finalizar Cadastro"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
