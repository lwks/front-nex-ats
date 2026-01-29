export type OnboardingOption = {
  value: string
  label: string
}

export const defaultExperienceOptions: OnboardingOption[] = [
  { value: "estagio", label: "Estágio" },
  { value: "junior", label: "1-3 anos" },
  { value: "pleno", label: "3-5 anos" },
  { value: "senior", label: "5+ anos" },
  { value: "especialista", label: "10-15 anos" },
  { value: "diretoria", label: "15+" }
]

export const defaultIndustryOptions: OnboardingOption[] = [
  { value: "agronegocio", label: "Agronegócio" },
  { value: "alimentos-bebidas", label: "Alimentos e Bebidas" },
  { value: "biotecnologia", label: "Biotecnologia" },
  { value: "comercio-atacadista", label: "Comércio Atacadista" },
  { value: "comercio-varejista", label: "Comércio Varejista" },
  { value: "construcao-civil", label: "Construção Civil" },
  { value: "cosmeticos-higiene-pessoal", label: "Cosméticos e Higiene Pessoal" },
  { value: "desenvolvimento-software", label: "Desenvolvimento de Software" },
  { value: "educacao-ensino", label: "Educação e Ensino" },
  { value: "ecommerce-marketplaces", label: "E-commerce e Marketplaces" },
  { value: "energia", label: "Energia (elétrica, solar, eólica, petróleo e gás)" },
  { value: "engenharia-projetos-industriais", label: "Engenharia e Projetos Industriais" },
  { value: "financeiro-bancario", label: "Financeiro e Bancário" },
  { value: "imobiliario", label: "Imobiliário" },
  { value: "industria-automotiva", label: "Indústria Automotiva" },
  { value: "industria-farmaceutica", label: "Indústria Farmacêutica" },
  { value: "logistica-transporte", label: "Logística e Transporte" },
  { value: "meio-ambiente-sustentabilidade", label: "Meio Ambiente e Sustentabilidade" },
  { value: "mineracao", label: "Mineração" },
  { value: "moda-textil", label: "Moda e Têxtil" },
  { value: "papel-celulose", label: "Papel e Celulose" },
  { value: "quimica-petroquimica", label: "Química e Petroquímica" },
  { value: "saude-servicos-hospitalares", label: "Saúde e Serviços Hospitalares" },
  { value: "seguros-previdencia", label: "Seguros e Previdência" },
  { value: "siderurgia-metalurgia", label: "Siderurgia e Metalurgia" },
  { value: "tecnologia-informacao-ti", label: "Tecnologia da Informação (TI)" },
  { value: "telecomunicacoes", label: "Telecomunicações" },
]

export const defaultWorkTypeOptions: OnboardingOption[] = [
  { value: "presencial", label: "Presencial" },
  { value: "remoto", label: "Remoto" },
  { value: "ambos", label: "Ambos" },
  { value: "hibrido", label: "Híbrido" },
]

export const defaultContractTypeOptions: OnboardingOption[] = [
  { value: "clt", label: "CLT" },
  { value: "pj", label: "PJ" },
  { value: "estagio", label: "Estágio" },
  { value: "temporario", label: "Temporário" },
  { value: "freelancer", label: "Freelancer" },
]
