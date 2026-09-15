import type { OnboardingOption } from "@/lib/onboarding-options"
import type { AreaOption } from "@/services/areas-service"

export type HardSkillCategory =
  | "engenharia-software"
  | "infraestrutura"
  | "dados"
  | "seguranca"
  | "rh"
  | "financas"
  | "vendas"
  | "marketing"
  | "produtos"
  | "operacoes"

function toOption(label: string): OnboardingOption {
  const value = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/#/g, "-sharp")
    .replace(/\+\+/g, "-plus-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return { value, label }
}

function createOptions(labels: string[]): OnboardingOption[] {
  return labels.map(toOption)
}

const hardSkillsByCategory: Record<HardSkillCategory, OnboardingOption[]> = {
  "engenharia-software": createOptions([
    "Lógica de programação", "Estruturas de dados", "Algoritmos", "Programação orientada a objetos (POO)",
    "Programação funcional", "Boas práticas de codificação", "Clean Code", "Java", "C#", "Python",
    "JavaScript", "TypeScript", "Go", "Kotlin", "PHP", "C++", "Rust", "Arquitetura em camadas",
    "Microsserviços", "Arquitetura orientada a eventos", "Design Patterns", "Princípios SOLID",
    "Arquitetura distribuída", "APIs REST", "GraphQL", "Frameworks Front-end", "Frameworks Back-end",
    "React", "Angular", "Vue.js", "SQL", "Bancos relacionais", "Bancos NoSQL", "Computação em nuvem",
    "Arquiteturas cloud-native", "Containers", "Kubernetes", "Testes unitários", "Testes de integração",
    "Testes automatizados", "Testes de performance", "Testes de carga", "Testes de segurança", "Testes de contrato",
  ]),
  infraestrutura: createOptions([
    "Administração de Windows Server", "Administração de Linux", "Gestão de usuários e permissões", "Active Directory",
    "Shell Script (Bash, PowerShell)", "Gerenciamento de serviços e processos", "Troubleshooting de sistemas operacionais",
    "TCP/IP", "DNS", "DHCP", "VLANs", "Roteamento e switching", "VPN", "Redes sem fio (Wi-Fi)", "SD-WAN",
    "Monitoramento de tráfego", "VMware vSphere", "Hyper-V", "KVM", "Gerenciamento de clusters", "AWS",
    "Microsoft Azure", "Google Cloud Platform (GCP)", "Arquiteturas híbridas", "Cloud pública e privada",
    "Provisionamento de recursos", "Gestão de custos em nuvem (FinOps)", "Serviços de rede em nuvem",
    "Backup e recuperação em nuvem", "Docker", "Kubernetes", "OpenShift", "Firewalls", "IDS/IPS",
    "Gestão de vulnerabilidades", "Hardening de servidores", "Controle de acesso", "Gestão de identidades (IAM)",
    "Certificados digitais", "Criptografia", "SIEM", "Segurança em nuvem", "ITIL", "Gestão de incidentes",
  ]),
  dados: createOptions([
    "Modelagem de dados", "Banco de dados relacionais", "Banco de dados NoSQL", "SQL", "Normalização e desnormalização",
    "Qualidade de dados", "Governança de dados", "Linhagem de dados (Data Lineage)", "Metadados", "ETL (Extract, Transform, Load)",
    "ELT (Extract, Load, Transform)", "Integração de dados", "Processamento distribuído", "Orquestração de workflows",
    "DataOps", "Data Lake", "Data Warehouse", "Data Mart", "Streaming de dados", "Processamento em tempo real",
    "Apache", "AWS Data Services", "Azure Data Services", "Google Cloud Data Services", "Data Lakes em nuvem",
    "BigQuery", "Snowflake", "Redshift", "Data Factory", "Power BI", "Tableau", "Qlik Sense", "Machine Learning",
    "Deep Learning", "Modelagem preditiva", "Séries temporais", "Python", "R", "Scala", "LLMs (Large Language Models)",
    "IA Generativa", "Engenharia de Prompt",
  ]),
  seguranca: createOptions([
    "Princípios de Confidencialidade, Integridade e Disponibilidade (CIA)", "Gestão de riscos", "Gestão de vulnerabilidades",
    "Análise de ameaças", "Segurança defensiva", "Segurança ofensiva", "Arquitetura de segurança",
    "Gestão de ativos de informação", "Governança de Segurança da Informação", "Gestão de riscos cibernéticos",
    "Auditoria de segurança", "Compliance regulatório", "Gestão de políticas de segurança", "Gestão de controles internos",
    "Avaliação de maturidade de segurança", "Gestão de terceiros e fornecedores", "ISO 27001", "ISO 27002", "COBIT",
    "ITIL aplicado à segurança", "PCI DSS", "Firewalls", "IDS/IPS", "VPN", "Análise de tráfego de rede",
    "Segurança de ambientes virtualizados", "Segurança de containers", "Segurança de Kubernetes", "Segurança de datacenter",
    "IAM", "AWS Security", "Azure Security", "Google Cloud Security", "Ethical Hacking", "Pentest de aplicações web",
    "Pentest de infraestrutura", "Pentest de redes", "LGPD",
  ]),
  rh: createOptions([
    "Legislação sindical", "Relações trabalhistas", "Acordos e convenções coletivas", "Gestão de passivos trabalhistas",
    "Compliance trabalhista", "Processos de auditoria trabalhista", "Admissão e desligamento", "Folha de pagamento",
    "Benefícios", "Controle de ponto", "Férias", "Rescisões", "eSocial", "Recrutamento estratégico", "Hunting de profissionais",
    "Entrevistas por competências", "Entrevistas estruturadas", "Mapeamento de mercado", "Employer Branding", "Talent Pool",
    "Educação corporativa", "Universidade corporativa", "Gestão de competências", "Desenvolvimento de liderança",
    "Gestão de desempenho", "Avaliação de desempenho", "Gestão por competências", "Plano de Desenvolvimento Individual (PDI)",
    "Gestão de clima organizacional", "Pesquisa de engajamento", "Gestão da mudança", "Cultura organizacional",
    "Sucessão e carreira", "Cargos e salários", "Gestão de stakeholders", "Diagnóstico organizacional",
    "Estratégias de diversidade", "Programas de inclusão", "Indicadores de diversidade", "HRIS", "ATS", "LGPD aplicada a RH",
  ]),
  financas: createOptions([
    "Contabilidade", "Normas contábeis (IFRS e CPC)", "Demonstrações financeiras", "Balanço patrimonial",
    "Demonstração do Resultado do Exercício (DRE)", "Demonstração do Fluxo de Caixa (DFC)", "Conciliação contábil",
    "Fechamento contábil", "Consolidação de demonstrações financeiras", "Planejamento financeiro", "Orçamento empresarial",
    "Forecast", "Rolling Forecast", "Planejamento estratégico financeiro", "Controle orçamentário",
    "Análise de desvios orçamentários", "Modelagem financeira", "Gestão de centros de custo", "Gestão de caixa", "Fluxo de caixa",
    "Capital de giro", "Gestão de liquidez", "Aplicações financeiras", "Due diligence financeira", "Valuation",
    "Fusões e aquisições (M&A)", "Estrutura de capital", "Custo de capital (WACC)", "Governança corporativa",
    "Gestão de investidores", "Captação de recursos", "Mercado de capitais", "Planejamento tributário",
    "Tributos diretos e indiretos", "Apuração de impostos", "Compliance fiscal", "Obrigações acessórias", "EBITDA",
    "Margem líquida", "Margem operacional", "ROI", "Financial Planning & Analysis",
  ]),
  vendas: createOptions([
    "Prospecção ativa", "Social Selling", "Qualificação de leads", "Mapeamento de mercado", "Pesquisa de prospects",
    "Venda consultiva", "Inside Sales", "Outbound Sales", "Inbound Sales", "Técnicas de fechamento", "Upsell e Cross-sell",
    "Negociação comercial", "Elaboração de propostas comerciais", "Precificação", "CRM (Salesforce, HubSpot, Pipedrive, RD Station)",
    "Automação de vendas", "Power BI", "IA aplicada a vendas", "Gestão de pipeline", "Forecast de vendas",
    "Análise de conversão do funil", "Gestão de carteira de clientes", "Customer Success", "Account Management",
    "Estratégias de retenção",
  ]),
  marketing: createOptions([
    "Prospecção ativa", "Qualificação de Leads", "Geração de Leads", "Mapeamento de Mercado", "Pesquisa de Clientes Potenciais",
    "Gestão de Pipeline", "Forecast de Vendas", "Gestão de Carteira de Clientes", "Planejamento Comercial", "Gestão de Metas",
    "Customer Success", "Account Management", "Ferramentas CRM", "Automação de Vendas", "Ferramentas de Prospecção",
    "Sales Engagement", "Cadência de Vendas", "Análise de KPIs Comerciais", "Relatórios de Performance", "Análise de Conversão",
    "Gestão de Indicadores", "Power BI",
  ]),
  produtos: createOptions([
    "Validação de hipóteses", "Discovery de produto", "Mapeamento de necessidades do cliente", "Product Management",
    "Product Ownership", "Roadmap de produto", "Priorização de backlog", "Gestão do ciclo de vida do produto",
    "Planejamento estratégico de produto", "Definição de requisitos", "Scrum", "Kanban", "Lean Startup",
    "Agile Product Management", "OKRs", "Design Sprint", "Product Analytics", "Análise de métricas de produto",
    "Definição e acompanhamento de KPIs", "Testes A/B", "UX Research", "UX Writing", "Jornada do usuário (Customer Journey)",
    "User Story Mapping", "Wireframing", "Prototipação", "Design Thinking", "Product Strategy", "Product-Market Fit",
    "Go-to-Market (GTM)", "Business Model Canvas", "Lean Canvas", "Análise financeira de produto", "Growth Product Management",
  ]),
  operacoes: createOptions([
    "Gestão de processos", "Mapeamento de processos (AS-IS e TO-BE)", "Padronização operacional", "Gestão de indicadores operacionais (KPIs)",
    "Planejamento operacional", "Controle de qualidade", "Gestão de riscos operacionais", "Lean Manufacturing", "Lean Office",
    "Kaizen", "Six Sigma", "PDCA", "BPM (Business Process Management)", "Gestão da eficiência operacional",
    "Criação de dashboards", "Análise de indicadores", "Forecast operacional", "Scrum", "Kanban", "PMBOK",
    "Metodologias ágeis", "ERP", "CRM", "Auditoria interna", "Gestão de compliance", "ISO 9001",
  ]),
}

export const areaToHardSkillCategories: Record<string, HardSkillCategory[]> = {
  financas: ["financas"],
  "recursos humanos": ["rh"],
  "comercial e vendas": ["vendas"],
  marketing: ["marketing"],
  produtos: ["produtos"],
  operacoes: ["operacoes"],
  "tecnologia da informacao": ["engenharia-software"],
  dados: ["dados"],
  "riscos e auditoria": ["seguranca"],
  "juridico e compliance": ["seguranca"],
  "supply chain": ["operacoes"],
  "customer success": ["vendas"],
  "administracao e facilities": ["operacoes"],
  "tecnologia-informacao-ti": ["engenharia-software"],
  "desenvolvimento-software": ["engenharia-software"],
  "financeiro-bancario": ["financas"],
  "ecommerce-marketplaces": ["vendas"],
  "saude-servicos-hospitalares": ["operacoes"],
}

function normalizeAreaKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

export function getHardSkillOptionsForAreas(selectedAreaValues: string[], areaOptions: AreaOption[]): OnboardingOption[] {
  const selectedCategories = new Set<HardSkillCategory>()

  selectedAreaValues.forEach((selectedValue) => {
    const area = areaOptions.find((option) => option.value === selectedValue)
    const key = normalizeAreaKey(area?.label ?? selectedValue)
    areaToHardSkillCategories[key]?.forEach((category) => selectedCategories.add(category))
  })

  const options = new Map<string, OnboardingOption>()
  selectedCategories.forEach((category) => {
    hardSkillsByCategory[category].forEach((option) => options.set(option.value, option))
  })

  return [...options.values()]
}

export function getHardSkillOptionsForCategory(category: HardSkillCategory): OnboardingOption[] {
  return hardSkillsByCategory[category]
}
