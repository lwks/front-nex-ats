"use client"

import { FormEvent, useState } from "react"

import { JOBS_API_CREATE_URL } from "@/config"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type JobFormState = {
  titulo: string
  descricao: string
  nivel: string
  localizacao: string
  modelo_trabalho: string
  publicada_em: string
  skills: string
  beneficios: string
  valor_inicial: string
  valor_final: string
}

type FeedbackState = {
  type: "success" | "error"
  message: string
} | null

const DEFAULT_JOB_STATUS = "Aberto"

function createDefaultFormState(): JobFormState {
  return {
    titulo: "",
    descricao: "",
    nivel: "",
    localizacao: "",
    modelo_trabalho: "",
    publicada_em: new Date().toISOString().split("T")[0],
    skills: "",
    beneficios: "",
    valor_inicial: "",
    valor_final: "",
  }
}

function parseList(rawValue: string): string[] {
  return rawValue
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export default function CreateJobPage() {
  const [formState, setFormState] = useState<JobFormState>(createDefaultFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackState>(null)

  const handleChange = (
    field: keyof JobFormState,
  ): React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> => {
    return (event) => {
      const { value } = event.target
      setFormState((previous) => ({
        ...previous,
        [field]: value,
      }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    const payload = {
      titulo: formState.titulo.trim(),
      descricao: formState.descricao.trim(),
      nivel: formState.nivel.trim(),
      localizacao: formState.localizacao.trim(),
      modelo_trabalho: formState.modelo_trabalho,
      publicada_em: formState.publicada_em,
      status: DEFAULT_JOB_STATUS,
      skills: parseList(formState.skills),
      beneficios: parseList(formState.beneficios),
      orcamento: {
        valor_inicial: Number(formState.valor_inicial) || 0,
        valor_final: Number(formState.valor_final) || 0,
      },
    }

    try {
      const response = await fetch(JOBS_API_CREATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorMessage = "Não foi possível criar a vaga. Tente novamente."

        try {
          const data = await response.json()
          if (data && typeof data === "object") {
            const record = data as Record<string, unknown>
            const possibleMessage = record.message ?? record.error ?? record.detail
            if (typeof possibleMessage === "string" && possibleMessage.trim().length > 0) {
              errorMessage = possibleMessage
            }
          }
        } catch (error) {
          console.error("Erro ao interpretar a resposta da API:", error)
        }

        throw new Error(errorMessage)
      }

      setFeedback({
        type: "success",
        message: "Vaga criada com sucesso!",
      })
      setFormState(createDefaultFormState())
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao criar a vaga."
      setFeedback({
        type: "error",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Cadastro de vaga</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Criar nova vaga</h1>
          <p className="mt-4 text-base text-muted-foreground">
            Preencha os campos abaixo para cadastrar uma nova oportunidade diretamente na API da NEXJOB.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="titulo">Título da vaga</Label>
              <Input
                id="titulo"
                name="titulo"
                placeholder="Ex: Desenvolvedor(a) Front-end"
                value={formState.titulo}
                onChange={handleChange("titulo")}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <textarea
                id="descricao"
                name="descricao"
                placeholder="Descreva as responsabilidades e requisitos da vaga"
                value={formState.descricao}
                onChange={handleChange("descricao")}
                required
                className={cn(
                  "min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors md:text-sm",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-muted/40 dark:focus-visible:bg-muted/20",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel">Nível</Label>
              <Input
                id="nivel"
                name="nivel"
                placeholder="Ex: Pleno"
                value={formState.nivel}
                onChange={handleChange("nivel")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localizacao">Localização</Label>
              <Input
                id="localizacao"
                name="localizacao"
                placeholder="Ex: São Paulo/SP"
                value={formState.localizacao}
                onChange={handleChange("localizacao")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo_trabalho">Modelo de trabalho atual</Label>
              <Select
                value={formState.modelo_trabalho}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    modelo_trabalho: value,
                  }))
                }
                required
              >
                <SelectTrigger id="modelo_trabalho" className="w-full">
                  <SelectValue placeholder="Selecione o modelo de trabalho" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="remote">Remoto</SelectItem>
                  <SelectItem value="hibrido">Hibrido</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicada_em">Data de publicação</Label>
              <Input
                id="publicada_em"
                name="publicada_em"
                type="date"
                value={formState.publicada_em}
                onChange={handleChange("publicada_em")}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="skills">Skills (separadas por vírgula ou quebra de linha)</Label>
              <textarea
                id="skills"
                name="skills"
                placeholder="Ex: React, TypeScript, Tailwind"
                value={formState.skills}
                onChange={handleChange("skills")}
                className={cn(
                  "min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors md:text-sm",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-muted/40 dark:focus-visible:bg-muted/20",
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="beneficios">Beneficios (separados por virgula ou quebra de linha)</Label>
              <textarea
                id="beneficios"
                name="beneficios"
                placeholder="Ex: VR, VA, PLR"
                value={formState.beneficios}
                onChange={handleChange("beneficios")}
                className={cn(
                  "min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors md:text-sm",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-muted/40 dark:focus-visible:bg-muted/20",
                )}
              />
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valor_inicial">Valor inicial (R$)</Label>
              <Input
                id="valor_inicial"
                name="valor_inicial"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={formState.valor_inicial}
                onChange={handleChange("valor_inicial")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_final">Valor final (R$)</Label>
              <Input
                id="valor_final"
                name="valor_final"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                value={formState.valor_final}
                onChange={handleChange("valor_final")}
              />
            </div>
          </section>

          {feedback ? (
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "rounded-md border px-4 py-3 text-sm",
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-destructive/20 bg-destructive/10 text-destructive",
              )}
            >
              {feedback.message}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-4">
            <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
              {isSubmitting ? "Salvando..." : "Criar vaga"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
