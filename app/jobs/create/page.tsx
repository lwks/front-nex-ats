"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { JOBS_API_PROXY_URL } from "@/config"
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
  formato_contratacao: string
  skills: string
  beneficios: string
  valor_inicial: string
  valor_final: string
  exibir_salario: boolean
}

const DEFAULT_JOB_STATUS = "Aberto"
const BRL_NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR")
const JOB_LEVEL_OPTIONS = [
  { value: "jr", label: "Jr" },
  { value: "pl", label: "Pl" },
  { value: "sr", label: "Sr" },
  { value: "esp", label: "Esp" },
]

const CONTRACT_FORMAT_OPTIONS = [
  { value: "pj", label: "PJ" },
  { value: "integral", label: "Integral" },
  { value: "temporario", label: "Temporário" },
  { value: "meio_periodo", label: "Meio período" },
]

function createDefaultFormState(): JobFormState {
  return {
    titulo: "",
    descricao: "",
    nivel: "",
    localizacao: "",
    modelo_trabalho: "",
    formato_contratacao: "",
    skills: "",
    beneficios: "",
    valor_inicial: "",
    valor_final: "",
    exibir_salario: false,
  }
}

function parseList(rawValue: string): string[] {
  return rawValue
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function formatCurrencyInput(rawValue: string): string {
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

function parseCurrencyToNumber(value: string): number {
  if (!value) {
    return 0
  }

  const normalized = value.replace(/\./g, "").replace(",", ".")
  const numericValue = Number(normalized)
  return Number.isNaN(numericValue) ? 0 : numericValue
}

function generateGuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

type ToastState = {
  type: "success" | "error"
  message: string
} | null

export default function CreateJobPage() {
  const router = useRouter()
  const [formState, setFormState] = useState<JobFormState>(createDefaultFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)

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

  const handleCurrencyChange = (
    field: "valor_inicial" | "valor_final",
  ): React.ChangeEventHandler<HTMLInputElement> => {
    return (event) => {
      const formattedValue = formatCurrencyInput(event.target.value)
      setFormState((previous) => ({
        ...previous,
        [field]: formattedValue,
      }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setToast(null)

    const payload = {
      titulo: formState.titulo.trim(),
      descricao: formState.descricao.trim(),
      nivel: formState.nivel,
      localizacao: formState.localizacao.trim(),
      modelo_trabalho: formState.modelo_trabalho,
      publicada_em: new Date().toISOString().split("T")[0],
      formato_contratacao: formState.formato_contratacao,
      exibir_salario: formState.exibir_salario,
      guid_id: generateGuid(),
      status: DEFAULT_JOB_STATUS,
      skills: parseList(formState.skills),
      beneficios: parseList(formState.beneficios),
      orcamento: {
        valor_inicial: parseCurrencyToNumber(formState.valor_inicial),
        valor_final: parseCurrencyToNumber(formState.valor_final),
      },
    }

    try {
      const response = await fetch(JOBS_API_PROXY_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
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

      setFormState(createDefaultFormState())
      setToast({
        type: "success",
        message: "Vaga criado com sucesso",
      })
      setTimeout(() => {
        router.push("/")
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao criar a vaga."
      setToast({
        type: "error",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {isSubmitting ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-5 shadow-xl">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Criando vaga...</p>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={cn(
            "fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition",
            toast.type === "success"
              ? "bg-emerald-500 text-white"
              : "bg-destructive text-destructive-foreground",
          )}
        >
          {toast.message}
        </div>
      ) : null}

      <Header />

      <main className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Cadastro de vaga</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Abertura de nova vaga</h1>
          <p className="mt-4 text-base text-muted-foreground">
            Preencha os campos abaixo para cadastrar uma nova oportunidade diretamente na NexJobs.
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
              <Select
                value={formState.nivel}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    nivel: value,
                  }))
                }
                required
              >
                <SelectTrigger id="nivel" className="w-full">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_LEVEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="formato_contratacao">Formato de contratação</Label>
              <Select
                value={formState.formato_contratacao}
                onValueChange={(value) =>
                  setFormState((previous) => ({
                    ...previous,
                    formato_contratacao: value,
                  }))
                }
                required
              >
                <SelectTrigger id="formato_contratacao" className="w-full">
                  <SelectValue placeholder="Selecione o formato" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formState.valor_inicial}
                onChange={handleCurrencyChange("valor_inicial")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor_final">Valor final (R$)</Label>
              <Input
                id="valor_final"
                name="valor_final"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formState.valor_final}
                onChange={handleCurrencyChange("valor_final")}
              />
            </div>
          </section>

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
