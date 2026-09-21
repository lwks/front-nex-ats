export type OnboardingOption = {
  value: string
  label: string
}

export type LanguageProficiencyOption = {
  value: string
  label: string
}

export type TravelAvailabilityOption = {
  value: string
  label: string
}

export const MAX_SKILL_SELECTIONS = 12

export type TeamCategory = "tecnologia" | "rh" | "financas" | "vendas" | "operacoes"

export const defaultTeamOptionsByCategory: Record<TeamCategory, OnboardingOption[]> = {
  tecnologia: [
    { value: "Análise de Dados", label: "Análise de Dados" },
    { value: "Arquitetura de Dados", label: "Arquitetura de Dados" },
    { value: "Arquitetura de Software", label: "Arquitetura de Software" },
    { value: "Business Intelligence (BI)", label: "Business Intelligence (BI)" },
    { value: "Ciência de Dados", label: "Ciência de Dados" },
    { value: "Cloud Engineering", label: "Cloud Engineering" },
    { value: "Desenvolvimento Back-end", label: "Desenvolvimento Back-end" },
    { value: "Desenvolvimento Front-end", label: "Desenvolvimento Front-end" },
    { value: "Desenvolvimento Full Stack", label: "Desenvolvimento Full Stack" },
    { value: "DevOps", label: "DevOps" },
    { value: "Engenharia de Dados", label: "Engenharia de Dados" },
    { value: "Engenharia de IA", label: "Engenharia de IA" },
    { value: "Engenharia de Software", label: "Engenharia de Software" },
    { value: "Help Desk", label: "Help Desk" },
    { value: "Infraestrutura de TI", label: "Infraestrutura de TI" },
    { value: "Machine Learning", label: "Machine Learning" },
    { value: "Quality Assurance (QA)", label: "Quality Assurance (QA)" },
    { value: "Redes", label: "Redes" },
    { value: "Segurança da Informação", label: "Segurança da Informação" },
    { value: "Site Reliability Engineering (SRE)", label: "Site Reliability Engineering (SRE)" },
    { value: "UI Design", label: "UI Design" },
    { value: "UX Design", label: "UX Design" },
  ],
  rh: [
    { value: "Business Partner", label: "Business Partner" },
    { value: "Departamento Pessoal", label: "Departamento Pessoal" },
    { value: "Employer Branding", label: "Employer Branding" },
    { value: "HR Operations", label: "HR Operations" },
    { value: "People Analytics", label: "People Analytics" },
    { value: "Remuneração e Benefícios", label: "Remuneração e Benefícios" },
    { value: "Talent Acquisition", label: "Talent Acquisition" },
    { value: "Treinamento e Desenvolvimento", label: "Treinamento e Desenvolvimento" },
  ],
  financas: [
    { value: "Auditoria", label: "Auditoria" },
    { value: "Compras/Procurement", label: "Compras/Procurement" },
    { value: "Contabilidade", label: "Contabilidade" },
    { value: "Contas a Pagar/Contas a Receber", label: "Contas a Pagar/Contas a Receber" },
    { value: "Controladoria", label: "Controladoria" },
    { value: "Crédito e Risco", label: "Crédito e Risco" },
    { value: "FP&A (Planejamento Financeiro)", label: "FP&A (Planejamento Financeiro)" },
    { value: "Investimentos", label: "Investimentos" },
    { value: "Tesouraria", label: "Tesouraria" },
  ],
  vendas: [
    { value: "Business Development", label: "Business Development" },
    { value: "Comercial", label: "Comercial" },
    { value: "Customer Success", label: "Customer Success" },
    { value: "Gerente de Contas", label: "Gerente de Contas" },
    { value: "Pós-Vendas", label: "Pós-Vendas" },
    { value: "Pré-Vendas", label: "Pré-Vendas" },
    { value: "RevOps", label: "RevOps" },
    { value: "Sales Ops / Revenue Ops", label: "Sales Ops / Revenue Ops" },
    { value: "SDR/BDR", label: "SDR/BDR" },
  ],
  operacoes: [
    { value: "Business Operations", label: "Business Operations" },
    { value: "Compliance e Risco", label: "Compliance e Risco" },
    { value: "Customer Ops / CX Ops", label: "Customer Ops / CX Ops" },
    { value: "Facilities", label: "Facilities" },
    { value: "Supply Chain / Logística", label: "Supply Chain / Logística" },
  ],
}

export const defaultTeamOptions: OnboardingOption[] = Object.values(defaultTeamOptionsByCategory)
  .flat()
  .sort((first, second) => first.label.localeCompare(second.label, "pt-BR"))

const teamCategoryByAreaLabel: Record<string, TeamCategory> = {
  "financas": "financas",
  "recursos humanos": "rh",
  "tecnologia da informacao": "tecnologia",
  "dados": "tecnologia",
  "comercial e vendas": "vendas",
  "marketing": "vendas",
  "operacoes": "operacoes",
  "supply chain": "operacoes",
  "juridico e compliance": "operacoes",
  "riscos e auditoria": "operacoes",
  "customer success": "vendas",
  "produtos": "vendas",
  "administracao e facilities": "operacoes",
}

function normalizeLookupValue(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export function getTeamOptionsForAreas(
  selectedAreaValues: string[],
  areaOptions: Array<Pick<OnboardingOption, "value" | "label">>,
): OnboardingOption[] {
  const selectedCategories = new Set<TeamCategory>()

  selectedAreaValues.forEach((selectedValue) => {
    const area = areaOptions.find((option) => option.value === selectedValue)
    const category = teamCategoryByAreaLabel[normalizeLookupValue(area?.label)]
    if (category) {
      selectedCategories.add(category)
    }
  })

  return [...new Map([...selectedCategories].flatMap((category) => defaultTeamOptionsByCategory[category]).map((option) => [option.value, option])).values()]
    .sort((first, second) => first.label.localeCompare(second.label, "pt-BR"))
}

export function normalizeTeamValue(value: unknown): string {
  const normalizedValue = String(value ?? "").trim()
  return defaultTeamOptions.some((option) => option.value === normalizedValue) ? normalizedValue : ""
}

export function normalizeTeamValueForAreas(
  value: unknown,
  selectedAreaValues: string[],
  areaOptions: Array<Pick<OnboardingOption, "value" | "label">>,
): string {
  const normalizedValue = normalizeTeamValue(value)
  return getTeamOptionsForAreas(selectedAreaValues, areaOptions).some((option) => option.value === normalizedValue)
    ? normalizedValue
    : ""
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

const TOP_SECTOR_VALUES = [
  "agronegocio",
  "alimentos-bebidas",
  "comercio-varejista",
  "construcao-civil",
  "desenvolvimento-software",
  "ecommerce-marketplaces",
  "energia",
  "engenharia-projetos-industriais",
  "financeiro-bancario",
  "industria-automotiva",
  "industria-farmaceutica",
  "logistica-transporte",
  "saude-servicos-hospitalares",
  "seguros-previdencia",
  "tecnologia-informacao-ti",
] as const

export const topSectorOptions: OnboardingOption[] = TOP_SECTOR_VALUES.map((value) => {
  const matchedOption = defaultIndustryOptions.find((option) => option.value === value)

  if (!matchedOption) {
    throw new Error(`Top sector option "${value}" is not available in defaultIndustryOptions.`)
  }

  return matchedOption
})

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

export const defaultSeniorityOptions: OnboardingOption[] = [
  { value: "estagio", label: "Estagio" },
  { value: "junior", label: "Junior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Senior" },
  { value: "especialista", label: "Especialista" },
  { value: "coordenador", label: "Coordenador" },
  { value: "gerente", label: "Gerente" },
  { value: "diretor", label: "Diretor" },
]

export const defaultLanguageOptions: OnboardingOption[] = [
  { value: "portugues", label: "Portugues" },
  { value: "ingles", label: "Ingles" },
  { value: "espanhol", label: "Espanhol" },
  { value: "frances", label: "Frances" },
  { value: "alemao", label: "Alemao" },
  { value: "italiano", label: "Italiano" },
]

export const defaultHardSkillOptions: OnboardingOption[] = [
  { value: "analise-dados", label: "Analise de dados" },
  { value: "automacao-processos", label: "Automacao de processos" },
  { value: "aws", label: "AWS" },
  { value: "azure", label: "Azure" },
  { value: "business-intelligence", label: "Business Intelligence" },
  { value: "compliance-lgpd", label: "Compliance / LGPD" },
  { value: "crm", label: "CRM" },
  { value: "ciberseguranca", label: "Ciberseguranca" },
  { value: "cloud-computing", label: "Cloud Computing" },
  { value: "excel-avancado", label: "Excel avancado" },
  { value: "figma", label: "Figma" },
  { value: "gestao-projetos", label: "Gestao de projetos" },
  { value: "git-github", label: "Git / GitHub" },
  { value: "inteligencia-artificial", label: "Inteligencia Artificial" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "machine-learning", label: "Machine Learning" },
  { value: "metricas-kpis", label: "Metricas e KPIs" },
  { value: "power-bi", label: "Power BI" },
  { value: "python", label: "Python" },
  { value: "react", label: "React" },
  { value: "sql", label: "SQL" },
  { value: "scrum-agile", label: "Scrum / Agile" },
  { value: "seo-performance", label: "SEO / Performance" },
  { value: "testes-qa", label: "Testes / QA" },
  { value: "typescript", label: "TypeScript" },
  { value: "ux-research", label: "UX Research" },
  { value: "vendas-b2b", label: "Vendas B2B" },
  { value: "visualizacao-dados", label: "Visualizacao de dados" },
  { value: "wordpress-cms", label: "WordPress / CMS" },
]

export const defaultSoftSkillOptions: OnboardingOption[] = [
  { value: "adaptabilidade", label: "Adaptabilidade" },
  { value: "aprendizado-continuo", label: "Aprendizado continuo" },
  { value: "atencao-detalhes", label: "Atencao aos detalhes" },
  { value: "colaboracao", label: "Colaboracao" },
  { value: "comunicacao-escrita", label: "Comunicacao escrita" },
  { value: "comunicacao-oral", label: "Comunicacao oral" },
  { value: "criatividade", label: "Criatividade" },
  { value: "empatia", label: "Empatia" },
  { value: "escuta-ativa", label: "Escuta ativa" },
  { value: "flexibilidade", label: "Flexibilidade" },
  { value: "gestao-conflitos", label: "Gestao de conflitos" },
  { value: "gestao-tempo", label: "Gestao do tempo" },
  { value: "influencia", label: "Influencia" },
  { value: "iniciativa", label: "Iniciativa" },
  { value: "inteligencia-emocional", label: "Inteligencia emocional" },
  { value: "lideranca", label: "Lideranca" },
  { value: "mentalidade-analitica", label: "Mentalidade analitica" },
  { value: "negociacao", label: "Negociacao" },
  { value: "orientacao-resultado", label: "Orientacao para resultado" },
  { value: "pensamento-critico", label: "Pensamento critico" },
  { value: "proatividade", label: "Proatividade" },
  { value: "resiliencia", label: "Resiliencia" },
  { value: "resolucao-problemas", label: "Resolucao de problemas" },
  { value: "responsabilidade", label: "Responsabilidade" },
  { value: "storytelling", label: "Storytelling" },
  { value: "tomada-decisao", label: "Tomada de decisao" },
  { value: "trabalho-equipe", label: "Trabalho em equipe" },
  { value: "visao-negocio", label: "Visao de negocio" },
  { value: "gestao-stakeholders", label: "Gestao de stakeholders" },
  { value: "ownership", label: "Ownership" },
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

export const defaultInterestRoleOptions: OnboardingOption[] = [
  { value: "analista-dados", label: "Analista de Dados" },
  { value: "analista-produto", label: "Analista de Produto" },
  { value: "designer-ux-ui", label: "Designer UX/UI" },
  { value: "desenvolvedor-front-end", label: "Desenvolvedor Front-end" },
  { value: "desenvolvedor-back-end", label: "Desenvolvedor Back-end" },
  { value: "desenvolvedor-full-stack", label: "Desenvolvedor Full Stack" },
  { value: "devops-sre", label: "DevOps / SRE" },
  { value: "engenheiro-dados", label: "Engenheiro de Dados" },
  { value: "gerente-produto", label: "Gerente de Produto" },
  { value: "product-owner", label: "Product Owner" },
  { value: "project-manager", label: "Project Manager" },
  { value: "qa-teste", label: "QA / Testes" },
  { value: "tech-lead", label: "Tech Lead" },
]

export const defaultInterestRoleAreaMap: Record<string, string[]> = {
  "analista-dados": ["4", "1", "12"],
  "analista-produto": ["3", "12", "1"],
  "designer-ux-ui": ["3", "12", "5"],
  "desenvolvedor-front-end": ["3", "12", "5"],
  "desenvolvedor-back-end": ["3", "1", "4"],
  "desenvolvedor-full-stack": ["3", "1", "12"],
  "devops-sre": ["3", "8", "7"],
  "engenheiro-dados": ["4", "1", "3"],
  "gerente-produto": ["3", "12", "1"],
  "product-owner": ["3", "12", "5"],
  "project-manager": ["3", "7", "13"],
  "qa-teste": ["3", "4", "7"],
  "tech-lead": ["3", "1", "4"],
}

export function resolveAreaValuesForRoles(
  cargoValues: string[],
  roleAreaMap: Record<string, string[]> = defaultInterestRoleAreaMap,
) {
  return [...new Set(cargoValues.flatMap((cargoValue) => roleAreaMap[cargoValue] ?? []))]
}

export function filterAreaSelectionsByRoles(
  cargoValues: string[],
  selectedAreaValues: string[],
  roleAreaMap: Record<string, string[]> = defaultInterestRoleAreaMap,
) {
  const allowedAreaValues = new Set(resolveAreaValuesForRoles(cargoValues, roleAreaMap))
  return selectedAreaValues.filter((areaValue) => allowedAreaValues.has(areaValue))
}

export const defaultToolOptions: OnboardingOption[] = [
  { value: "adobe-creative-cloud", label: "Adobe Creative Cloud" },
  { value: "asana", label: "Asana" },
  { value: "aws", label: "AWS" },
  { value: "azure-devops", label: "Azure DevOps" },
  { value: "canva", label: "Canva" },
  { value: "clickup", label: "ClickUp" },
  { value: "confluence", label: "Confluence" },
  { value: "discord", label: "Discord" },
  { value: "docker", label: "Docker" },
  { value: "excel", label: "Excel" },
  { value: "figma", label: "Figma" },
  { value: "ga4", label: "Google Analytics 4" },
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "hubspot", label: "HubSpot" },
  { value: "jira", label: "Jira" },
  { value: "looker-studio", label: "Looker Studio" },
  { value: "microsoft-teams", label: "Microsoft Teams" },
  { value: "miro", label: "Miro" },
  { value: "notion", label: "Notion" },
  { value: "power-bi", label: "Power BI" },
  { value: "powerpoint", label: "PowerPoint" },
  { value: "salesforce", label: "Salesforce" },
  { value: "sap", label: "SAP" },
  { value: "slack", label: "Slack" },
  { value: "sql-server", label: "SQL Server" },
  { value: "tableau", label: "Tableau" },
  { value: "trello", label: "Trello" },
  { value: "vs-code", label: "VS Code" },
  { value: "wordpress", label: "WordPress" },
]

export const defaultTravelAvailabilityOptions: TravelAvailabilityOption[] = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Nao" },
]

export const defaultLanguageProficiencyOptions: LanguageProficiencyOption[] = [
  { value: "basico", label: "Basico" },
  { value: "intermediario", label: "Intermediario" },
  { value: "avancado", label: "Avancado" },
  { value: "fluente", label: "Fluente" },
  { value: "nativo", label: "Nativo" },
]
