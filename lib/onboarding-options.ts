export type OnboardingOption = {
  value: string
  label: string
}

export const defaultExperienceOptions: OnboardingOption[] = [
  { value: "estagio", label: "Estágio" },
  { value: "junior", label: "Júnior (1-3 anos)" },
  { value: "pleno", label: "Pleno (3-5 anos)" },
  { value: "senior", label: "Sênior (5+ anos)" },
  { value: "especialista", label: "Especialista (10+ anos)" },
]

export const defaultIndustryOptions: OnboardingOption[] = [
  { value: "tecnologia", label: "Tecnologia" },
  { value: "financeiro", label: "Financeiro" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "varejo", label: "Varejo" },
  { value: "industria", label: "Indústria" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
]

export const defaultWorkTypeOptions: OnboardingOption[] = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "hibrido", label: "Híbrido" },
]

export const defaultContractTypeOptions: OnboardingOption[] = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "estagio", label: "Estágio" },
  { value: "temporario", label: "Temporário" },
  { value: "freelancer", label: "Freelancer" },
]
