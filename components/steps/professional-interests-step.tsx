"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { CandidateData } from "../candidate-onboarding"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProfessionalInterestsStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onSubmit: () => void
  onBack: () => void
}

export function ProfessionalInterestsStep({ data, onUpdate, onSubmit, onBack }: ProfessionalInterestsStepProps) {
  const [formData, setFormData] = useState({
    industriaInteresse: data.industriaInteresse || "",
    cargoInteresseDetalhado: data.cargoInteresseDetalhado || "",
    tipoTrabalho: data.tipoTrabalho || "",
    tipoContratacao: data.tipoContratacao || "",
    compartilhamentoAccepted: data.compartilhamentoAccepted || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.compartilhamentoAccepted) {
      alert("Por favor, confirme o compartilhamento de dados para continuar.")
      return
    }
    onUpdate(formData)
    onSubmit()
  }

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Interesses Profissionais</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="industriaInteresse">Indústria de Interesse</Label>
          <Select
            value={formData.industriaInteresse}
            onValueChange={(value) => setFormData({ ...formData, industriaInteresse: value })}
            required
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Selecione a indústria de interesse" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tecnologia">Tecnologia</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="saude">Saúde</SelectItem>
              <SelectItem value="educacao">Educação</SelectItem>
              <SelectItem value="varejo">Varejo</SelectItem>
              <SelectItem value="industria">Indústria</SelectItem>
              <SelectItem value="servicos">Serviços</SelectItem>
              <SelectItem value="outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cargoInteresseDetalhado">Cargo de Interesse</Label>
          <Input
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
            value={formData.tipoTrabalho}
            onValueChange={(value) => setFormData({ ...formData, tipoTrabalho: value })}
            required
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Selecione o tipo de trabalho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="remoto">Remoto</SelectItem>
              <SelectItem value="hibrido">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipoContratacao">Tipo de Contratação</Label>
          <Select
            value={formData.tipoContratacao}
            onValueChange={(value) => setFormData({ ...formData, tipoContratacao: value })}
            required
          >
            <SelectTrigger className="bg-input">
              <SelectValue placeholder="Selecione o tipo de contratação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clt">CLT</SelectItem>
              <SelectItem value="pj">PJ</SelectItem>
              <SelectItem value="estagio">Estágio</SelectItem>
              <SelectItem value="temporario">Temporário</SelectItem>
              <SelectItem value="freelancer">Freelancer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="compartilhamento"
            checked={formData.compartilhamentoAccepted}
            onCheckedChange={(checked) => setFormData({ ...formData, compartilhamentoAccepted: checked as boolean })}
          />
          <div className="space-y-1 leading-none">
            <Label htmlFor="compartilhamento" className="text-sm font-normal cursor-pointer">
              Confirmação de Compartilhamento
            </Label>
            <p className="text-xs text-muted-foreground">
              Autorizo o compartilhamento dos meus dados profissionais com empresas parceiras da plataforma NEXJOB para
              fins de recrutamento e seleção
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 bg-transparent" size="lg">
            Voltar
          </Button>
          <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
            Finalizar Cadastro
          </Button>
        </div>
      </form>
    </div>
  )
}
