import Link from "next/link"

import { JOBS_API_LIST_URL } from "@/config"

import { Header } from "./header"
import { Button } from "./ui/button"

type ApiJob = {
  id?: string | number
  slug?: string
  codigo?: string | number
  uuid?: string
  titulo?: string
  title?: string
  nome?: string
  empresa?: string
  company?: string
  nome_empresa?: string
  localizacao?: string
  location?: string
  cidade?: string
  estado?: string
  uf?: string
  modalidade?: string
  tipoContratacao?: string
  tipo_contratacao?: string
  tipoTrabalho?: string
  workType?: string
  regime?: string
  jornada?: string
  descricao?: string
  description?: string
  resumo?: string
  summary?: string
  applyUrl?: string
  apply_url?: string
  link?: string
  linkCandidatura?: string
  candidatura_url?: string
} & Record<string, unknown>

type JobCard = {
  id: string
  title: string
  company: string
  location: string
  workType: string
  description: string
  applyHref: string
  isExternal: boolean
}

const MOCK_JOBS: JobCard[] = [
  {
    id: "dev-fullstack",
    title: "Desenvolvedor(a) Full Stack",
    company: "NEXJOB Tech",
    location: "Remoto",
    workType: "CLT • Tempo integral",
    description:
      "Atue no desenvolvimento de novas features, revisão de código e integração contínua usando Node.js e React.",
    applyHref: "https://example.com/vagas/dev-fullstack",
    isExternal: true,
  },
  {
    id: "product-manager",
    title: "Product Manager",
    company: "Inovação Digital",
    location: "São Paulo/SP (Híbrido)",
    workType: "PJ • Híbrido",
    description:
      "Lidere squads multidisciplinares, defina roadmap de produto e acompanhe métricas de sucesso.",
    applyHref: "/candidaturas?vaga=product-manager",
    isExternal: false,
  },
  {
    id: "designer-ui",
    title: "Designer UI/UX",
    company: "Estúdio Criativo",
    location: "Porto Alegre/RS (Presencial)",
    workType: "CLT • Presencial",
    description:
      "Crie interfaces acessíveis, participe de pesquisas com usuários e colabore com time de desenvolvimento.",
    applyHref: "https://example.com/vagas/designer-ui",
    isExternal: true,
  },
  {
    id: "analista-dados",
    title: "Analista de Dados",
    company: "Data Insights",
    location: "Belo Horizonte/MG (Remoto)",
    workType: "CLT • Remoto",
    description:
      "Construa pipelines de dados, crie dashboards e suporte decisões de negócio com análises avançadas.",
    applyHref: "/candidaturas?vaga=analista-dados",
    isExternal: false,
  },
  {
    id: "estagio-marketing",
    title: "Estágio em Marketing",
    company: "Startup Growth",
    location: "Curitiba/PR (Híbrido)",
    workType: "Estágio • 6h/dia",
    description:
      "Apoie campanhas digitais, produção de conteúdo e acompanhamento de performance em múltiplos canais.",
    applyHref: "https://example.com/vagas/estagio-marketing",
    isExternal: true,
  },
  {
    id: "tech-lead",
    title: "Tech Lead Mobile",
    company: "Fintech Plus",
    location: "Recife/PE (Híbrido)",
    workType: "PJ • Híbrido",
    description:
      "Guie arquiteturas mobile, oriente o time iOS/Android e assegure qualidade das entregas.",
    applyHref: "/candidaturas?vaga=tech-lead",
    isExternal: false,
  },
]

type ApiPayload = ApiJob[] | Record<string, unknown>

function pickString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }

    if (typeof value === "number" && !Number.isNaN(value)) {
      return String(value)
    }
  }

  return undefined
}

function extractJobs(payload: unknown): ApiJob[] {
  if (Array.isArray(payload)) {
    return payload as ApiJob[]
  }

  if (payload && typeof payload === "object") {
    const container = payload as Record<string, unknown>
    const possibleKeys = ["items", "results", "data", "vagas", "jobs", "content"]

    for (const key of possibleKeys) {
      const value = container[key]
      if (Array.isArray(value)) {
        return value as ApiJob[]
      }
    }
  }

  return []
}

function normalizeJob(job: ApiJob, index: number): JobCard {
  const idSource = pickString(job.id, job.slug, job.codigo, job.uuid) ?? `vaga-${index}`
  const city = pickString(job.cidade)
  const state = pickString(job.estado, job.uf)
  const cityState = city && state ? `${city}/${state}` : city ?? state

  const title = pickString(job.titulo, job.title, job.nome) ?? "Vaga sem título"
  const company = pickString(job.company, job.empresa, job.nome_empresa) ?? "Empresa confidencial"
  const location =
    pickString(job.localizacao, job.location, cityState) ?? "Localização não informada"
  const workType =
    pickString(
      job.workType,
      job.tipoTrabalho,
      job.modalidade,
      job.tipoContratacao,
      job.tipo_contratacao,
      job.regime,
      job.jornada,
    ) ?? "Tipo de contratação não informado"
  const description =
    pickString(job.descricao, job.description, job.resumo, job.summary) ??
    "Descrição indisponível no momento."

  const applyCandidate = pickString(
    job.applyUrl,
    job.apply_url,
    job.link,
    job.linkCandidatura,
    job.candidatura_url,
  )
  const fallbackHref = `/candidaturas?vaga=${encodeURIComponent(idSource)}`
  const applyHref = applyCandidate ?? fallbackHref
  const isExternal = !!applyCandidate && /^https?:\/\//.test(applyHref)

  return {
    id: idSource,
    title,
    company,
    location,
    workType,
    description,
    applyHref,
    isExternal,
  }
}

async function fetchJobs(): Promise<{ jobs: JobCard[]; error?: string }> {
  try {
    const response = await fetch(JOBS_API_LIST_URL, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const payload: ApiPayload = await response.json()
    const jobs = extractJobs(payload).map((job, index) => normalizeJob(job, index))

    if (jobs.length > 0) {
      return { jobs }
    }

    return { jobs: MOCK_JOBS }
  } catch (error) {
    console.error("Erro ao buscar vagas:", error)
    return {
      jobs: MOCK_JOBS,
      error: "Não foi possível carregar as vagas no momento. Tente novamente em instantes.",
    }
  }
}

export async function JobListings() {
  const { jobs, error } = await fetchJobs()
  const showEmptyState = !error && jobs.length === 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <header className="mb-12 text-center md:text-left">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Encontre sua próxima oportunidade
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Vagas em destaque na NEXJOB
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:w-2/3">
            Explore as oportunidades disponíveis e escolha aquela que mais combina com o seu momento
            profissional. Ao se candidatar você será redirecionado para completar o cadastro.
          </p>
        </header>

        {error ? (
          <div className="mb-8 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {jobs.length > 0 ? (
          <section className="grid gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <article
                key={job.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-primary">{job.company}</span>
                    <span>{job.location}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-foreground">{job.title}</h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{job.workType}</p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {job.description}
                  </p>
                </div>

                <div className="mt-6">
                  <Button asChild className="w-full rounded-full md:w-auto">
                    <Link
                      href={job.applyHref}
                      {...(job.isExternal
                        ? {
                            target: "_blank",
                            rel: "noopener noreferrer",
                          }
                        : undefined)}
                    >
                      Candidatar-se
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        {showEmptyState ? (
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Nenhuma vaga disponível no momento. Volte em breve para conferir novas oportunidades.
          </p>
        ) : null}
      </main>
    </div>
  )
}
