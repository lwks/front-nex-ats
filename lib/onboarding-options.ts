export type OnboardingOption = {
  value: string
  label: string
}

export const defaultExperienceOptions: OnboardingOption[] = [
  { value: "estagio", label: "Estagio" },
  { value: "junior", label: "1-3 anos" },
  { value: "pleno", label: "3-5 anos" },
  { value: "senior", label: "5+ anos" },
  { value: "especialista", label: "10-15 anos" },
  { value: "diretoria", label: "15+" },
]

export const defaultIndustryOptions: OnboardingOption[] = [
  { value: "agronegocio", label: "Agronegocio" },
  { value: "alimentos-bebidas", label: "Alimentos e Bebidas" },
  { value: "biotecnologia", label: "Biotecnologia" },
  { value: "comercio-atacadista", label: "Comercio Atacadista" },
  { value: "comercio-varejista", label: "Comercio Varejista" },
  { value: "construcao-civil", label: "Construcao Civil" },
  { value: "cosmeticos-higiene-pessoal", label: "Cosmeticos e Higiene Pessoal" },
  { value: "desenvolvimento-software", label: "Desenvolvimento de Software" },
  { value: "educacao-ensino", label: "Educacao e Ensino" },
  { value: "ecommerce-marketplaces", label: "E-commerce e Marketplaces" },
  { value: "energia", label: "Energia" },
  { value: "engenharia-projetos-industriais", label: "Engenharia e Projetos Industriais" },
  { value: "financeiro-bancario", label: "Financeiro e Bancario" },
  { value: "imobiliario", label: "Imobiliario" },
  { value: "industria-automotiva", label: "Industria Automotiva" },
  { value: "industria-farmaceutica", label: "Industria Farmaceutica" },
  { value: "logistica-transporte", label: "Logistica e Transporte" },
  { value: "meio-ambiente-sustentabilidade", label: "Meio Ambiente e Sustentabilidade" },
  { value: "mineracao", label: "Mineracao" },
  { value: "moda-textil", label: "Moda e Textil" },
  { value: "papel-celulose", label: "Papel e Celulose" },
  { value: "quimica-petroquimica", label: "Quimica e Petroquimica" },
  { value: "saude-servicos-hospitalares", label: "Saude e Servicos Hospitalares" },
  { value: "seguros-previdencia", label: "Seguros e Previdencia" },
  { value: "siderurgia-metalurgia", label: "Siderurgia e Metalurgia" },
  { value: "tecnologia-informacao-ti", label: "Tecnologia da Informacao (TI)" },
  { value: "telecomunicacoes", label: "Telecomunicacoes" },
]

export const defaultWorkTypeOptions: OnboardingOption[] = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "ambos", label: "Ambos" },
  { value: "hibrido", label: "Hibrido" },
]

export const defaultContractTypeOptions: OnboardingOption[] = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "estagio", label: "Estagio" },
  { value: "temporario", label: "Temporario" },
  { value: "freelancer", label: "Freelancer" },
]

export const defaultLanguageOptions: OnboardingOption[] = [
  { value: "portugues", label: "Portugues" },
  { value: "ingles", label: "Ingles" },
  { value: "espanhol", label: "Espanhol" },
  { value: "frances", label: "Frances" },
  { value: "alemao", label: "Alemao" },
  { value: "italiano", label: "Italiano" },
]

export const defaultProfessionalSkillOptions: OnboardingOption[] = [
  { value: "gestao-projetos", label: "Gestao de projetos" },
  { value: "analise-dados", label: "Analise de dados" },
  { value: "sql", label: "SQL" },
  { value: "excel", label: "Excel avancado" },
  { value: "power-bi", label: "Power BI" },
  { value: "figma", label: "Figma" },
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "ux-research", label: "UX Research" },
  { value: "negociacao", label: "Negociacao" },
]

export const defaultCurrentBenefitOptions: OnboardingOption[] = [
  { value: "vale-refeicao", label: "Vale refeicao" },
  { value: "vale-alimentacao", label: "Vale alimentacao" },
  { value: "plano-saude", label: "Plano de saude" },
  { value: "plano-odonto", label: "Plano odontologico" },
  { value: "gympass", label: "Gympass / Wellhub" },
  { value: "plr", label: "PLR" },
  { value: "auxilio-home-office", label: "Auxilio home office" },
  { value: "vale-transporte", label: "Vale transporte" },
]
