import { MAX_AREA_SELECTIONS, MAX_PREFERENCE_SECTOR_SELECTIONS, MAX_PREFERENCE_SENIORITY_SELECTIONS, MAX_TEAM_SELECTIONS, type OnboardingOption } from "@/lib/onboarding-options"
import { areaValuesToNumbers } from "@/services/areas-service"

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
export const MIN_DESCRIPTION_LENGTH = 30

function parseCurrencyToNumber(value: string): number {
  if (!value) return 0
  const numericValue = Number(value.replace(/\./g, "").replace(",", "."))
  return Number.isNaN(numericValue) ? 0 : numericValue
}

export function validateJobFormState(form: JobFormState) {
  const plainDescription = form.descricao.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim()
  if (form.titulo.trim().length < MIN_TITLE_LENGTH) throw new Error("O titulo da vaga deve ter pelo menos " + MIN_TITLE_LENGTH + " caracteres.")
  if (plainDescription.length < MIN_DESCRIPTION_LENGTH) throw new Error("A descricao deve ter pelo menos " + MIN_DESCRIPTION_LENGTH + " caracteres.")
  if (form.area.length === 0) throw new Error("Selecione ao menos uma area.")
  if (form.area.length > MAX_AREA_SELECTIONS) throw new Error("Selecione no maximo " + MAX_AREA_SELECTIONS + " area.")
  if (form.time.length === 0) throw new Error("Selecione ao menos um time.")
  if (form.time.length > MAX_TEAM_SELECTIONS) throw new Error("Selecione no maximo " + MAX_TEAM_SELECTIONS + " times.")
  if (form.senioridade.length === 0) throw new Error("Selecione ao menos uma senioridade.")
  if (form.senioridade.length > MAX_PREFERENCE_SENIORITY_SELECTIONS) throw new Error("Selecione no maximo " + MAX_PREFERENCE_SENIORITY_SELECTIONS + " senioridades.")
  if (form.setor.length === 0) throw new Error("Selecione ao menos um setor.")
  if (form.setor.length > MAX_PREFERENCE_SECTOR_SELECTIONS) throw new Error("Selecione no maximo " + MAX_PREFERENCE_SECTOR_SELECTIONS + " setores.")
  if (!form.cidade.trim() || !form.estado.trim()) throw new Error("Informe cidade e estado.")
  if (!form.modelo_trabalho) throw new Error("Selecione o modelo de trabalho.")
  if (!form.formato_contratacao) throw new Error("Selecione o formato de contratacao.")
  if (!form.experiencia) throw new Error("Selecione a experiencia profissional.")
  if (form.beneficios.length === 0) throw new Error("Selecione ao menos um beneficio.")
  if (form.hardSkills.length === 0) throw new Error("Selecione ao menos uma hard skill.")
  if (form.hardSkills.length > MAX_JOB_SKILL_SELECTIONS) throw new Error("Selecione no maximo " + MAX_JOB_SKILL_SELECTIONS + " hard skills.")
  if (form.softSkills.length === 0) throw new Error("Selecione ao menos uma soft skill.")
  if (form.softSkills.length > MAX_JOB_SKILL_SELECTIONS) throw new Error("Selecione no maximo " + MAX_JOB_SKILL_SELECTIONS + " soft skills.")
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
