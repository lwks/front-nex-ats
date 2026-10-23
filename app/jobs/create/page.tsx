"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { JOBS_API_PROXY_URL } from "@/config"
import {
  defaultCurrentBenefitOptions,
  defaultExperienceOptions,
  defaultSeniorityOptions,
  defaultSoftSkillOptions,
  getTeamOptionsForAreas,
  MAX_AREA_SELECTIONS,
  MAX_PREFERENCE_SECTOR_SELECTIONS,
  MAX_PREFERENCE_SENIORITY_SELECTIONS,
  MAX_TEAM_SELECTIONS,
  topSectorOptions,
  type OnboardingOption,
} from "@/lib/onboarding-options"
import { cn } from "@/lib/utils"
import { useAreaOptions } from "@/hooks/use-area-options"
import { getHardSkillOptionsForAreas } from "@/services/hard-skills-service"
import { areaValuesToNumbers } from "@/services/areas-service"
import {
  fetchCurrentBenefitOptions,
  fetchExperienceOptions,
  fetchSeniorityOptions,
  fetchSoftSkillOptions,
} from "@/services/onboarding-options-service"

export type JobFormState = {
  titulo: string
  descricao: string
  area: string[]
  time: string[]
  senioridade: string[]
  setor: string[]
  cidade: string
  estado: string
  modelo_trabalho: string
  formato_contratacao: string
  experiencia: string
  beneficios: string[]
  hardSkills: string[]
  softSkills: string[]
  valor_inicial: string
  valor_final: string
  exibir_salario: boolean
}

export const MAX_JOB_SKILL_SELECTIONS = 7
const MIN_TITLE_LENGTH = 5
const MIN_DESCRIPTION_LENGTH = 30
const BRL_NUMBER_FORMATTER = new Intl.NumberFormat("pt-BR")
const CONTRACT_FORMAT_OPTIONS = [
  { value: "pj", label: "PJ" },
  { value: "integral", label: "Integral" },
  { value: "temporario", label: "Temporario" },
  { value: "meio_periodo", label: "Meio periodo" },
]
const WORK_TYPE_OPTIONS = [
  { value: "remote", label: "Remoto" },
  { value: "hibrido", label: "Hibrido" },
  { value: "presencial", label: "Presencial" },
]

function createDefaultFormState(): JobFormState {
  return {
    titulo: "",
    descricao: "",
    area: [],
    time: [],
    senioridade: [],
    setor: [],
    cidade: "",
    estado: "",
    modelo_trabalho: "",
    formato_contratacao: "",
    experiencia: "",
    beneficios: [],
    hardSkills: [],
    softSkills: [],
    valor_inicial: "",
    valor_final: "",
    exibir_salario: false,
  }
}

function parseCurrencyToNumber(value: string): number {
  if (!value) return 0
  const numericValue = Number(value.replace(/\./g, "").replace(",", "."))
  return Number.isNaN(numericValue) ? 0 : numericValue
}

function formatCurrencyInput(rawValue: string): string {
  const digitsOnly = rawValue.replace(/\D/g, "")
  return digitsOnly ? BRL_NUMBER_FORMATTER.format(Number(digitsOnly)) : ""
}

function generateGuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function validateJobFormState(form: JobFormState) {
  const plainDescription = form.descricao.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
  if (form.titulo.trim().length < MIN_TITLE_LENGTH) throw new Error(`O titulo da vaga deve ter pelo menos ${MIN_TITLE_LENGTH} caracteres.`)
  if (plainDescription.length < MIN_DESCRIPTION_LENGTH) throw new Error(`A descricao deve ter pelo menos ${MIN_DESCRIPTION_LENGTH} caracteres.`)
  if (form.area.length === 0) throw new Error("Selecione ao menos uma area.")
  if (form.area.length > MAX_AREA_SELECTIONS) throw new Error(`Selecione no maximo ${MAX_AREA_SELECTIONS} area.`)
  if (form.time.length === 0) throw new Error("Selecione ao menos um time.")
  if (form.time.length > MAX_TEAM_SELECTIONS) throw new Error(`Selecione no maximo ${MAX_TEAM_SELECTIONS} times.`)
  if (form.senioridade.length === 0) throw new Error("Selecione ao menos uma senioridade.")
  if (form.senioridade.length > MAX_PREFERENCE_SENIORITY_SELECTIONS) throw new Error(`Selecione no maximo ${MAX_PREFERENCE_SENIORITY_SELECTIONS} senioridades.`)
  if (form.setor.length === 0) throw new Error("Selecione ao menos um setor.")
  if (form.setor.length > MAX_PREFERENCE_SECTOR_SELECTIONS) throw new Error(`Selecione no maximo ${MAX_PREFERENCE_SECTOR_SELECTIONS} setores.`)
  if (!form.cidade.trim() || !form.estado.trim()) throw new Error("Informe cidade e estado.")
  if (!form.modelo_trabalho) throw new Error("Selecione o modelo de trabalho.")
  if (!form.formato_contratacao) throw new Error("Selecione o formato de contratacao.")
  if (!form.experiencia) throw new Error("Selecione a experiencia profissional.")
  if (form.beneficios.length === 0) throw new Error("Selecione ao menos um beneficio.")
  if (form.hardSkills.length === 0) throw new Error("Selecione ao menos uma hard skill.")
  if (form.hardSkills.length > MAX_JOB_SKILL_SELECTIONS) throw new Error(`Selecione no maximo ${MAX_JOB_SKILL_SELECTIONS} hard skills.`)
  if (form.softSkills.length === 0) throw new Error("Selecione ao menos uma soft skill.")
  if (form.softSkills.length > MAX_JOB_SKILL_SELECTIONS) throw new Error(`Selecione no maximo ${MAX_JOB_SKILL_SELECTIONS} soft skills.`)
  if (!form.valor_inicial.trim() || !form.valor_final.trim()) throw new Error("Informe os valores inicial e final.")
  const min = parseCurrencyToNumber(form.valor_inicial)
  const max = parseCurrencyToNumber(form.valor_final)
  if (min < 0 || max < 0) throw new Error("Os valores nao podem ser negativos.")
  if (min > max) throw new Error("O valor inicial nao pode ser maior que o valor final.")
}

export function buildJobPayload(form: JobFormState, guidId: string, publishedAt: string, areaOptions?: OnboardingOption[]) {
  validateJobFormState(form)
  return {
    titulo: form.titulo.trim(),
    descricao: form.descricao.trim(),
    area: areaValuesToNumbers(form.area, areaOptions),
    time: form.time,
    senioridade: form.senioridade,
    setor: form.setor,
    cidade: form.cidade.trim(),
    estado: form.estado.trim(),
    modelo_trabalho: form.modelo_trabalho,
    formato_contratacao: form.formato_contratacao,
    experiencia: form.experiencia,
    beneficios: form.beneficios,
    skills: form.hardSkills,
    soft_skills: form.softSkills,
    publicada_em: publishedAt,
    exibir_salario: form.exibir_salario,
    guid_id: guidId,
    status: "Aberto",
    orcamento: {
      valor_inicial: parseCurrencyToNumber(form.valor_inicial),
      valor_final: parseCurrencyToNumber(form.valor_final),
    },
  }
}

type ToastState = { type: "success" | "error"; message: string } | null

export default function CreateJobPage() {
  const router = useRouter()
  const [form, setForm] = useState<JobFormState>(createDefaultFormState)
  const [toast, setToast] = useState<ToastState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [seniorityOptions, setSeniorityOptions] = useState(defaultSeniorityOptions)
  const [experienceOptions, setExperienceOptions] = useState(defaultExperienceOptions)
  const [benefitOptions, setBenefitOptions] = useState(defaultCurrentBenefitOptions)
  const [softSkillOptions, setSoftSkillOptions] = useState(defaultSoftSkillOptions)
  const areaOptions = useAreaOptions()
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    let mounted = true
    Promise.all([
      fetchSeniorityOptions(),
      fetchExperienceOptions(),
      fetchCurrentBenefitOptions(),
      fetchSoftSkillOptions(),
    ]).then(([seniorities, experiences, benefits, softSkills]) => {
      if (!mounted) return
      setSeniorityOptions(seniorities)
      setExperienceOptions(experiences)
      setBenefitOptions(benefits)
      setSoftSkillOptions(softSkills)
    }).catch((loadError) => console.error("Failed to load job create options", loadError))
    return () => { mounted = false }
  }, [])

  const teamOptions = useMemo(() => getTeamOptionsForAreas(form.area, areaOptions), [form.area, areaOptions])
  const hardSkillOptions = useMemo(() => getHardSkillOptionsForAreas(form.area, areaOptions), [form.area, areaOptions])

  useEffect(() => {
    const teams = form.time.filter((team) => teamOptions.some((option) => option.value === team))
    const hardSkills = form.hardSkills.filter((skill) => hardSkillOptions.some((option) => option.value === skill))
    if (teams.length !== form.time.length || hardSkills.length !== form.hardSkills.length) {
      setForm((current) => ({ ...current, time: teams, hardSkills }))
    }
  }, [form.area, form.hardSkills, form.time, hardSkillOptions, teamOptions])

  const update = <K extends keyof JobFormState>(field: K, value: JobFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setToast(null)
    let payload: ReturnType<typeof buildJobPayload>
    try {
      payload = buildJobPayload(form, generateGuid(), new Date().toISOString().split("T")[0], areaOptions)
    } catch (validationError) {
      setToast({ type: "error", message: validationError instanceof Error ? validationError.message : "Revise os campos obrigatorios." })
      return
    }
    setIsSubmitting(true)
    try {
      const response = await fetch(JOBS_API_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        let message = "Nao foi possivel criar a vaga. Tente novamente."
        try {
          const result = await response.json() as Record<string, unknown>
          const apiMessage = result.message ?? result.error ?? result.detail
          if (typeof apiMessage === "string" && apiMessage.trim()) message = apiMessage.trim()
        } catch { /* The default message covers empty and non-JSON responses. */ }
        throw new Error(message)
      }
      setForm(createDefaultFormState())
      setToast({ type: "success", message: "Vaga criada com sucesso." })
      setTimeout(() => router.push("/empresa/candidaturas"), 1200)
    } catch (submitError) {
      setToast({ type: "error", message: submitError instanceof Error ? submitError.message : "Erro inesperado ao criar a vaga." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const areaChange = (areas: string[]) => {
    const allowedSkills = new Set(getHardSkillOptionsForAreas(areas, areaOptions).map((option) => option.value))
    setForm((current) => ({
      ...current,
      area: areas,
      time: current.time.filter((team) => getTeamOptionsForAreas(areas, areaOptions).some((option) => option.value === team)),
      hardSkills: current.hardSkills.filter((skill) => allowedSkills.has(skill)),
    }))
  }

  const fieldClass = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      {isSubmitting ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm"><p className="rounded-lg border bg-card px-6 py-5 shadow-xl">Criando vaga...</p></div> : null}
      {toast ? <div role="alert" className={cn("fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg", toast.type === "success" ? "bg-emerald-500 text-white" : "bg-destructive text-destructive-foreground")}>{toast.message}</div> : null}
      <main className="mx-auto max-w-4xl rounded-3xl border border-border bg-card px-6 py-8 shadow-sm md:px-10">
        <header className="mb-8">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Cadastro de vaga</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Abertura de nova vaga</h1>
          <p className="mt-4 text-base text-muted-foreground">Preencha os campos abaixo para cadastrar uma nova oportunidade.</p>
        </header>
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="titulo">Titulo da vaga</Label>
              <Input id="titulo" value={form.titulo} minLength={MIN_TITLE_LENGTH} onChange={(event) => update("titulo", event.target.value)} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descricao">Descricao</Label>
              <textarea ref={descriptionRef} id="descricao" value={form.descricao} onChange={(event) => update("descricao", event.target.value)} minLength={MIN_DESCRIPTION_LENGTH} required className={cn(fieldClass, "min-h-36 resize-y")} placeholder="Descreva as responsabilidades e requisitos da vaga" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <MultiSelect id="area" maxSelections={MAX_AREA_SELECTIONS} options={areaOptions} placeholder="Selecione uma area" value={form.area} onChange={areaChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <MultiSelect id="time" maxSelections={MAX_TEAM_SELECTIONS} options={teamOptions} disabled={teamOptions.length === 0} placeholder={form.area.length ? `Selecione ate ${MAX_TEAM_SELECTIONS} times` : "Selecione uma area primeiro"} value={form.time} onChange={(value) => update("time", value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senioridade">Senioridade</Label>
              <MultiSelect id="senioridade" maxSelections={MAX_PREFERENCE_SENIORITY_SELECTIONS} options={seniorityOptions} placeholder={`Selecione ate ${MAX_PREFERENCE_SENIORITY_SELECTIONS} senioridades`} value={form.senioridade} onChange={(value) => update("senioridade", value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setor">Setor</Label>
              <MultiSelect id="setor" maxSelections={MAX_PREFERENCE_SECTOR_SELECTIONS} options={topSectorOptions} placeholder={`Selecione ate ${MAX_PREFERENCE_SECTOR_SELECTIONS} setores`} value={form.setor} onChange={(value) => update("setor", value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" value={form.cidade} onChange={(event) => update("cidade", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" value={form.estado} maxLength={2} onChange={(event) => update("estado", event.target.value.toUpperCase())} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelo_trabalho">Modelo de trabalho</Label>
              <Select value={form.modelo_trabalho} onValueChange={(value) => update("modelo_trabalho", value)} required>
                <SelectTrigger id="modelo_trabalho" className="w-full"><SelectValue placeholder="Selecione o modelo de trabalho" /></SelectTrigger>
                <SelectContent>{WORK_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="formato_contratacao">Formato de contratacao</Label>
              <Select value={form.formato_contratacao} onValueChange={(value) => update("formato_contratacao", value)} required>
                <SelectTrigger id="formato_contratacao" className="w-full"><SelectValue placeholder="Selecione o formato" /></SelectTrigger>
                <SelectContent>{CONTRACT_FORMAT_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experiencia">Experiencia profissional</Label>
              <Select value={form.experiencia} onValueChange={(value) => update("experiencia", value)} required>
                <SelectTrigger id="experiencia" className="w-full"><SelectValue placeholder="Selecione a experiencia" /></SelectTrigger>
                <SelectContent>{experienceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficios">Beneficios</Label>
              <MultiSelect id="beneficios" options={benefitOptions} placeholder="Selecione os beneficios" value={form.beneficios} onChange={(value) => update("beneficios", value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hardSkills">Hard Skills</Label>
              <MultiSelect id="hardSkills" maxSelections={MAX_JOB_SKILL_SELECTIONS} options={hardSkillOptions} disabled={hardSkillOptions.length === 0} placeholder={form.area.length ? `Selecione ate ${MAX_JOB_SKILL_SELECTIONS} hard skills` : "Selecione uma area primeiro"} value={form.hardSkills} onChange={(value) => update("hardSkills", value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="softSkills">Soft Skills</Label>
              <MultiSelect id="softSkills" maxSelections={MAX_JOB_SKILL_SELECTIONS} options={softSkillOptions} placeholder={`Selecione ate ${MAX_JOB_SKILL_SELECTIONS} soft skills`} value={form.softSkills} onChange={(value) => update("softSkills", value)} />
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2"><Label htmlFor="valor_inicial">Valor inicial (R$)</Label><Input id="valor_inicial" inputMode="numeric" value={form.valor_inicial} onChange={(event) => update("valor_inicial", formatCurrencyInput(event.target.value))} required /></div>
            <div className="space-y-2"><Label htmlFor="valor_final">Valor final (R$)</Label><Input id="valor_final" inputMode="numeric" value={form.valor_final} onChange={(event) => update("valor_final", formatCurrencyInput(event.target.value))} required /></div>
            <label htmlFor="exibir_salario" className="flex items-center gap-3 self-end rounded-md border p-3 text-sm font-medium"><Checkbox id="exibir_salario" checked={form.exibir_salario} onCheckedChange={(checked) => update("exibir_salario", checked === true)} />Exibir faixa salarial</label>
          </section>
          <div className="flex justify-end"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Criando vaga..." : "Criar vaga"}</Button></div>
        </form>
      </main>
    </div>
  )
}
