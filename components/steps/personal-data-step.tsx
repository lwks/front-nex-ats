"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CandidateData } from "../candidate-onboarding"

interface PersonalDataStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onNext: () => void
}

export function PersonalDataStep({ data, onUpdate, onNext }: PersonalDataStepProps) {
  const [formData, setFormData] = useState({
    nome: data.nome || "",
    documento: data.documento || "",
    localResidencia: data.localResidencia || "",
    contato: data.contato || "",
    lgpdAccepted: data.lgpdAccepted || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
            className="bg-input"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="documento">Documento</Label>
          <Input
            id="documento"
            type="text"
            placeholder="CPF ou RG"
            value={formData.documento}
            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
            required
            className="bg-input"
          />
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
            onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
            required
            className="bg-input"
          />
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
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground mt-8"
          size="lg"
        >
          Continuar
        </Button>
      </form>
    </div>
  )
}
