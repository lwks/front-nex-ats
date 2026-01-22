"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useRef, useState } from "react"

import { JOBS_API_PROXY_URL, ZIPS_API_PROXY_URL } from "@/config"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

type JobFormState = {
  titulo: string
  descricao: string
  cargo: string
  nivel: string
  localizacao: string
  cidade: string
  estado: string
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
const JOB_ROLE_OPTIONS = [
  { value: "estagiario", label: "Estagiario" },
  { value: "analista", label: "Analista" },
  { value: "coordenador", label: "Coordenador" },
  { value: "gerente", label: "Gerente" },
  { value: "diretor", label: "Diretor" },
]
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

const CEP_LENGTH = 8
const MIN_TITLE_LENGTH = 5
const MIN_DESCRIPTION_LENGTH = 30


type ZipLookupResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  cidade?: string
  estado?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

function createDefaultFormState(): JobFormState {
  return {
    titulo: "",
    descricao: "",
    cargo: "",
    nivel: "",
    localizacao: "",
    cidade: "",
    estado: "",
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

function pickFirstStringValue(data: ZipLookupResponse, keys: string[]): string | undefined {
  for (const key of keys) {
    const rawValue = data[key]
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }

  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function normalizeZipResponse(rawData: ZipLookupResponse | null, cep: string): ZipLookupResponse {
  const normalizedData: ZipLookupResponse = rawData ? { ...rawData } : {}
  const nestedData = isRecord(rawData?.data) ? (rawData?.data as Record<string, unknown>) : null

  if (nestedData) {
    for (const [key, value] of Object.entries(nestedData)) {
      if (normalizedData[key] === undefined) {
        normalizedData[key] = value
      }
    }
  }

  if (typeof normalizedData.cep !== "string" && cep.length > 0) {
    normalizedData.cep = cep
  }

  return normalizedData
}

function formatZipSummary(data: ZipLookupResponse): string | null {
  const street = pickFirstStringValue(data, ["logradouro", "street", "address"])
  const neighborhood = pickFirstStringValue(data, ["bairro", "neighborhood"])
  const city = pickFirstStringValue(data, ["localidade", "cidade", "city"])
  const state = pickFirstStringValue(data, ["uf", "estado", "state"])

  const segments: string[] = []

  if (street) {
    segments.push(street)
  }

  if (neighborhood) {
    segments.push(neighborhood)
  }

  if (city && state) {
    segments.push(`${city}/${state}`)
  } else if (city) {
    segments.push(city)
  } else if (state) {
    segments.push(state)
  }

  if (segments.length === 0) {
    const cep = pickFirstStringValue(data, ["cep"])
    return cep ?? null
  }

  return segments.join(" · ")
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
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false)
  const [zipLookupError, setZipLookupError] = useState<string | null>(null)
  const [zipLookupResult, setZipLookupResult] = useState<ZipLookupResponse | null>(null)
  const [hasAttemptedZipLookup, setHasAttemptedZipLookup] = useState(false)
  const zipLookupController = useRef<AbortController | null>(null)
  const descriptionEditorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      zipLookupController.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!descriptionEditorRef.current) {
      return
    }

    if (descriptionEditorRef.current.innerHTML !== formState.descricao) {
      descriptionEditorRef.current.innerHTML = formState.descricao
    }
  }, [formState.descricao])

  const zipSummary = zipLookupResult ? formatZipSummary(zipLookupResult) : null
  const isNivelDisabled = formState.cargo === "estagiario"
  const isCepMissing = formState.localizacao.trim().length === 0
  const isCepIncomplete =
    formState.localizacao.length > 0 && formState.localizacao.length < CEP_LENGTH
  const hasZipCityState = Boolean(formState.cidade.trim() && formState.estado.trim())
  const shouldValidateZip =
    isCepMissing || hasAttemptedZipLookup || formState.localizacao.length === CEP_LENGTH
  const isZipValidationBlocked =
    shouldValidateZip &&
    (isCepMissing ||
      isCepIncomplete ||
      isZipLookupLoading ||
      Boolean(zipLookupError) ||
      !hasZipCityState)
  const isTitleTooShort = formState.titulo.trim().length < MIN_TITLE_LENGTH
  const descriptionPlainText = formState.descricao
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const isDescriptionTooShort = descriptionPlainText.length < MIN_DESCRIPTION_LENGTH
  const initialSalaryValue = parseCurrencyToNumber(formState.valor_inicial)
  const finalSalaryValue = parseCurrencyToNumber(formState.valor_final)
  const isSalaryMissing =
    formState.valor_inicial.trim().length === 0 || formState.valor_final.trim().length === 0
  const isSalaryNegative = initialSalaryValue < 0 || finalSalaryValue < 0
  const isSalaryRangeInvalid = initialSalaryValue > finalSalaryValue
  const isSalaryInvalid = isSalaryMissing || isSalaryNegative || isSalaryRangeInvalid
  const zipValidationMessage = isZipLookupLoading
    ? "Consultando CEP..."
    : zipLookupError
      ? zipLookupError
      : isCepMissing
        ? "Informe o CEP."
        : shouldValidateZip && !hasZipCityState
        ? "Informe um CEP válido para preencher cidade e estado."
        : isCepIncomplete
          ? `Informe os ${CEP_LENGTH} dígitos do CEP.`
          : zipSummary
            ? "Localizado com sucesso."
            : null
  const salaryValidationMessage = isSalaryMissing
    ? "Informe os valores inicial e final."
    : isSalaryNegative
      ? "Os valores não podem ser negativos."
      : isSalaryRangeInvalid
        ? "O valor inicial não pode ser maior que o valor final."
        : null
  const cityStateDisplay =
    formState.cidade && formState.estado
      ? `${formState.cidade}, ${formState.estado}`
      : formState.cidade || formState.estado || ""
  const blockingMessage = isZipLookupLoading
    ? "Consultando CEP..."
    : isSubmitting
      ? "Criando vaga..."
      : null

  const updateCityStateFromZip = (data: ZipLookupResponse | null) => {
    const city = data ? pickFirstStringValue(data, ["localidade", "cidade", "city"]) : undefined
    const state = data ? pickFirstStringValue(data, ["uf", "estado", "state"]) : undefined

    setFormState((previous) => ({
      ...previous,
      cidade: city ?? "",
      estado: state ?? "",
    }))
  }

  const lookupZip = async (cep: string) => {
    if (zipLookupController.current) {
      zipLookupController.current.abort()
    }

    const controller = new AbortController()
    zipLookupController.current = controller

    setIsZipLookupLoading(true)
    setZipLookupError(null)
    setZipLookupResult(null)
    setHasAttemptedZipLookup(true)
    updateCityStateFromZip(null)

    try {
      const response = await fetch(`${ZIPS_API_PROXY_URL}/${cep}`, {
        signal: controller.signal,
      })
      console.log("Resposta bruta da consulta de CEP:", response)
      let responseData: unknown = null

      try {
        responseData = await response.json()
      } catch (error) {
        console.error("Erro ao ler o corpo da resposta do CEP:", error)
      }

      console.log("Resposta da consulta de CEP:", responseData)
      if (!response.ok) {
        let errorMessage = "Não foi possível consultar o CEP informado."

        if (isRecord(responseData)) {
          const possibleMessage = responseData.message
          if (typeof possibleMessage === "string" && possibleMessage.trim().length > 0) {
            errorMessage = possibleMessage.trim()
          }
        }

        throw new Error(errorMessage)
      }

      const parsedBody = isRecord(responseData) ? (responseData as ZipLookupResponse) : null

      const normalizedResult = normalizeZipResponse(parsedBody, cep)
      setZipLookupResult(normalizedResult)
      updateCityStateFromZip(normalizedResult)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      console.error("Erro ao consultar CEP:", error)
      const normalizedMessage = error instanceof Error ? error.message.trim() : ""
      setZipLookupError(
        normalizedMessage.length > 0 ? normalizedMessage : "Não foi possível consultar o CEP informado.",
      )
      setZipLookupResult(null)
      updateCityStateFromZip(null)
    } finally {
      if (zipLookupController.current === controller) {
        zipLookupController.current = null
        setIsZipLookupLoading(false)
      }
    }
  }

  const handleZipChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, CEP_LENGTH)

    setFormState((previous) => ({
      ...previous,
      localizacao: digitsOnly,
      ...(digitsOnly.length < CEP_LENGTH
        ? {
          cidade: "",
          estado: "",
        }
        : {}),
    }))

    setHasAttemptedZipLookup(digitsOnly.length === CEP_LENGTH)

    if (digitsOnly.length === CEP_LENGTH) {
      void lookupZip(digitsOnly)
    } else {
      if (zipLookupController.current) {
        zipLookupController.current.abort()
        zipLookupController.current = null
      }
      setZipLookupResult(null)
      setZipLookupError(null)
      setHasAttemptedZipLookup(false)
      setIsZipLookupLoading(false)
      updateCityStateFromZip(null)
    }
  }

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

  const handleDescriptionInput: React.FormEventHandler<HTMLDivElement> = (event) => {
    const htmlValue = event.currentTarget.innerHTML
    setFormState((previous) => ({
      ...previous,
      descricao: htmlValue,
    }))
  }

  const applyDescriptionFormat = (command: "bold" | "italic" | "underline") => {
    if (!descriptionEditorRef.current) {
      return
    }

    descriptionEditorRef.current.focus()
    document.execCommand(command)
    const htmlValue = descriptionEditorRef.current.innerHTML
    setFormState((previous) => ({
      ...previous,
      descricao: htmlValue,
    }))
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
    setToast(null)

    if (isZipValidationBlocked) {
      setToast({
        type: "error",
        message: "Consulte um CEP válido para preencher cidade e estado antes de salvar.",
      })
      return
    }

    if (isTitleTooShort) {
      setToast({
        type: "error",
        message: `O título da vaga deve ter pelo menos ${MIN_TITLE_LENGTH} caracteres.`,
      })
      return
    }

    if (isDescriptionTooShort) {
      setToast({
        type: "error",
        message: `A descrição deve ter pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres.`,
      })
      return
    }

    if (isSalaryInvalid) {
      setToast({
        type: "error",
        message: salaryValidationMessage ?? "Informe uma faixa salarial válida.",
      })
      return
    }

    setIsSubmitting(true)

    const payload = {
      titulo: formState.titulo.trim(),
      descricao: formState.descricao.trim(),
      cargo: formState.cargo,
      nivel: formState.nivel,
      localizacao: formState.localizacao.trim(),
      modelo_trabalho: formState.modelo_trabalho,
      publicada_em: new Date().toISOString().split("T")[0],
      formato_contratacao: formState.formato_contratacao,
      exibir_salario: formState.exibir_salario,
      guid_id: generateGuid(),
      status: DEFAULT_JOB_STATUS,
      cidade: formState.cidade.trim(),
      estado: formState.estado.trim(),
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
      {blockingMessage ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-5 shadow-xl">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">{blockingMessage}</p>
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
        <div className="rounded-3xl border border-border bg-card px-6 py-8 shadow-sm md:px-10">
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
                  minLength={MIN_TITLE_LENGTH}
                />
                {isTitleTooShort ? (
                  <p className="text-xs text-destructive">
                    Informe pelo menos {MIN_TITLE_LENGTH} caracteres.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Formatação
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDescriptionFormat("bold")}
                    className="h-8 px-3 text-xs font-semibold"
                  >
                    Negrito
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDescriptionFormat("italic")}
                    className="h-8 px-3 text-xs font-semibold italic"
                  >
                    Itálico
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyDescriptionFormat("underline")}
                    className="h-8 px-3 text-xs font-semibold underline"
                  >
                    Sublinhado
                  </Button>
                </div>
                <div
                  id="descricao"
                  ref={descriptionEditorRef}
                  role="textbox"
                  aria-label="Descrição da vaga"
                  contentEditable
                  data-placeholder="Descreva as responsabilidades e requisitos da vaga"
                  onInput={handleDescriptionInput}
                  className={cn(
                    "min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-colors md:text-sm",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:bg-muted/40 dark:focus-visible:bg-muted/20",
                    "relative whitespace-pre-wrap outline-none before:pointer-events-none before:absolute before:left-3 before:top-2 before:text-muted-foreground",
                    "empty:before:content-[attr(data-placeholder)]",
                  )}
                />
                {isDescriptionTooShort ? (
                  <p className="text-xs text-destructive">
                    Informe pelo menos {MIN_DESCRIPTION_LENGTH} caracteres.
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={formState.cargo}
                  onValueChange={(value) =>
                    setFormState((previous) => ({
                      ...previous,
                      cargo: value,
                      ...(value === "estagiario" ? { nivel: "" } : {}),
                    }))
                  }
                  required
                >
                  <SelectTrigger id="cargo" className="w-full">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nivel">Nível</Label>
                <Select
                  disabled={isNivelDisabled}
                  value={formState.nivel}
                  onValueChange={(value) =>
                    setFormState((previous) => ({
                      ...previous,
                      nivel: value,
                    }))
                  }
                  required={!isNivelDisabled}
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

              <div className="md:col-span-2 grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-1">
                  <Label htmlFor="localizacao">CEP:</Label>
                  <Input
                    id="localizacao"
                    name="localizacao"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={CEP_LENGTH}
                    placeholder="Somente números"
                    value={formState.localizacao}
                    onChange={handleZipChange}
                    required
                  />
                  {zipValidationMessage ? (
                    <p
                      className={cn(
                        "text-xs",
                        isZipValidationBlocked && !isZipLookupLoading
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {zipValidationMessage}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="cidade_estado">Cidade / Estado</Label>
                  <Input
                    id="cidade_estado"
                    name="cidade_estado"
                    value={cityStateDisplay}
                    placeholder="Informe o CEP para preencher automaticamente"
                    readOnly
                  />
                </div>
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

            <section className="grid gap-6 md:grid-cols-3">
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
                  required
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
                  required
                />
                {salaryValidationMessage ? (
                  <p className="text-xs text-destructive">{salaryValidationMessage}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exibir_salario" className="text-sm font-medium text-muted-foreground">
                  Exibir Salário?
                </Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="exibir_salario"
                    checked={formState.exibir_salario}
                    onCheckedChange={(checked) =>
                      setFormState((previous) => ({
                        ...previous,
                        exibir_salario: Boolean(checked),
                      }))
                    }
                    className="bg-card border-muted-foreground/60"
                  />
                  <span className="text-sm font-semibold text-foreground">Sim</span>
                </div>
              </div>
            </section>

            <div className="flex items-center justify-end gap-4">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  isZipValidationBlocked ||
                  isSalaryInvalid ||
                  isTitleTooShort ||
                  isDescriptionTooShort
                }
                className="min-w-[160px]"
              >
                {isSubmitting ? "Salvando..." : "Criar vaga"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
