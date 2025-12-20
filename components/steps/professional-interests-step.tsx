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
  const [industryOptions, setIndustryOptions] = useState<OnboardingOption[]>(defaultIndustryOptions)
  const [workTypeOptions, setWorkTypeOptions] = useState<OnboardingOption[]>(defaultWorkTypeOptions)
  const [contractTypeOptions, setContractTypeOptions] = useState<OnboardingOption[]>(defaultContractTypeOptions)

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
            onValueChange={(value) => setFormData({ ...formData, industriaInteresse: value })}
            required
          >
            <SelectTrigger className="bg-input">
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
            required
            className="bg-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoTrabalho">Tipo de Trabalho</Label>
          <Select
            disabled={isSubmitting}
            value={formData.tipoTrabalho}
            onValueChange={(value) => setFormData({ ...formData, tipoTrabalho: value })}
            required
          >
            <SelectTrigger className="bg-input">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoContratacao">Tipo de Contratação</Label>
          <Select
            disabled={isSubmitting}
            value={formData.tipoContratacao}
            onValueChange={(value) => setFormData({ ...formData, tipoContratacao: value })}
            required
          >
            <SelectTrigger className="bg-input">
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
        </div>

        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="compartilhamento"
            disabled={isSubmitting}
            checked={formData.compartilhamentoAccepted}
            onCheckedChange={(checked) => setFormData({ ...formData, compartilhamentoAccepted: checked as boolean })}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="compartilhamento" className="text-sm font-normal cursor-pointer">
              Confirmação de Compartilhamento
            </Label>
            <p className="text-xs text-muted-foreground">
              Autorizo o compartilhamento dos meus dados profissionais com empresas parceiras da plataforma NexJob para
              fins de recrutamento e seleção
            </p>
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
            disabled={isSubmitting}
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
