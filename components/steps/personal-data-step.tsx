"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { CandidateData } from "../candidate-onboarding"

interface PersonalDataStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onNext: () => void
}

const CPF_LENGTH = 11
const RG_MIN_LENGTH = 7
const RG_MAX_LENGTH = 10

const hasFullName = (value: string) => value.trim().split(/\s+/).length >= 2

const calcCpfDigit = (base: string, factor: number) => {
  let total = 0
  for (const char of base) {
    total += Number(char) * factor--
  }
  const remainder = total % 11
  return remainder < 2 ? 0 : 11 - remainder
}

const validateCpf = (value: string) => {
  if (value.length !== CPF_LENGTH) return false
  if (/^(\d)\1{10}$/.test(value)) return false

  const firstNine = value.slice(0, 9)
  const firstDigit = calcCpfDigit(firstNine, 10)
  const secondDigit = calcCpfDigit(firstNine + firstDigit, 11)

  return value === `${firstNine}${firstDigit}${secondDigit}`
}

const isValidEmail = (value: string) => {
  if (!value) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

const getDocumentError = (value: string) => {
  if (!value) {
    return "Informe seu CPF ou RG."
  }

  if (value.length === CPF_LENGTH) {
    return validateCpf(value) ? "" : "Informe um CPF válido."
  }

  if (value.length >= RG_MIN_LENGTH && value.length <= RG_MAX_LENGTH) {
    return ""
  }

  return `Informe um CPF com ${CPF_LENGTH} dígitos ou um RG entre ${RG_MIN_LENGTH} e ${RG_MAX_LENGTH} dígitos.`
}

export function PersonalDataStep({ data, onUpdate, onNext }: PersonalDataStepProps) {
  const [formData, setFormData] = useState({
    nome: data.nome || "",
    documento: (data.documento || "").replace(/\D/g, ""),
    localResidencia: data.localResidencia || "",
    contato: data.contato || "",
    lgpdAccepted: data.lgpdAccepted || false,
  })
  const [errors, setErrors] = useState({
    nome: "",
    documento: "",
    contato: "",
  })

  const isFormComplete =
    hasFullName(formData.nome) &&
    getDocumentError(formData.documento) === "" &&
    Boolean(formData.localResidencia.trim()) &&
    isValidEmail(formData.contato) &&
    formData.lgpdAccepted

  const validateFields = () => {
    const newErrors = { nome: "", documento: "", contato: "" }

    if (!hasFullName(formData.nome)) {
      newErrors.nome = "Informe nome e sobrenome."
    }

    const documentError = getDocumentError(formData.documento)
    if (documentError) {
      newErrors.documento = documentError
    }

    if (!isValidEmail(formData.contato)) {
      newErrors.contato = "Digite um e-mail válido."
    }

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateFields()) {
      return
    }
    if (!formData.lgpdAccepted) {
      alert("Por favor, aceite os termos da LGPD para continuar.")
      return
    }
    onUpdate(formData)
    onNext()
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Dados Pessoais</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            type="text"
            placeholder="Digite seu nome completo"
            value={formData.nome}
            onChange={(e) => {
              if (errors.nome) {
                setErrors((previous) => ({ ...previous, nome: "" }))
              }
              setFormData({ ...formData, nome: e.target.value })
            }}
            required
            className="bg-input"
            aria-invalid={errors.nome ? "true" : "false"}
          />
          {errors.nome ? <p className="text-xs text-destructive">{errors.nome}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="documento">Documento</Label>
          <Input
            id="documento"
            type="text"
            placeholder="CPF ou RG"
            value={formData.documento}
            onChange={(e) => {
              if (errors.documento) {
                setErrors((previous) => ({ ...previous, documento: "" }))
              }
              const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, CPF_LENGTH)
              setFormData({ ...formData, documento: digitsOnly })
            }}
            required
            className="bg-input"
            aria-invalid={errors.documento ? "true" : "false"}
            inputMode="numeric"
            maxLength={CPF_LENGTH}
          />
          {errors.documento ? <p className="text-xs text-destructive">{errors.documento}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="localResidencia">Local de Residência</Label>
          <Input
            id="localResidencia"
            type="text"
            placeholder="Cidade, Estado"
            value={formData.localResidencia}
            onChange={(e) => setFormData({ ...formData, localResidencia: e.target.value })}
            required
            className="bg-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contato">Contato / Email</Label>
          <Input
            id="contato"
            type="email"
            placeholder="seu@email.com"
            value={formData.contato}
            onChange={(e) => {
              if (errors.contato) {
                setErrors((previous) => ({ ...previous, contato: "" }))
              }
              setFormData({ ...formData, contato: e.target.value })
            }}
            required
            className="bg-input"
            aria-invalid={errors.contato ? "true" : "false"}
          />
          {errors.contato ? <p className="text-xs text-destructive">{errors.contato}</p> : null}
        </div>

        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="lgpd"
            checked={formData.lgpdAccepted}
            onCheckedChange={(checked) => setFormData({ ...formData, lgpdAccepted: checked as boolean })}
            className="bg-card border-muted-foreground/60"
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="lgpd" className="text-sm font-normal cursor-pointer">
              Confirmação LGPD
            </Label>
            <p className="text-xs text-muted-foreground">
              Aceito o compartilhamento dos meus dados conforme a Lei Geral de Proteção de Dados
            </p>
          </div>
        </div>

        <Button
          type="submit"
          className={cn(
            "w-full mt-8",
            isFormComplete
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
          size="lg"
          disabled={!isFormComplete}
        >
          Continuar
        </Button>
      </form>
    </div>
  )
}
