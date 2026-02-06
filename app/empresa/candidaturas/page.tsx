"use client"

import { useState } from "react"

const stages = [
  { key: "novos", label: "Novos" },
  { key: "rh", label: "Entrevista RH" },
  { key: "hm", label: "Entrevista HM" },
  { key: "oferta", label: "Oferta" },
  { key: "contratado", label: "Contratado" },
  { key: "rejeitado", label: "Rejeitados" },
] as const

type StageKey = (typeof stages)[number]["key"]

type Candidate = {
  id: string
  name: string
  role: string
  status: string
  email: string
  phone: string
  workModel: string
  seniority: string
  experience: string
  skills: string[]
  linkedinUrl: string
}

type Job = {
  id: string
  title: string
  location: string
  team: string
  createdBy: string
  createdAt: string
  salaryRange: string
  reportUrl: string
  stages: Record<StageKey, Candidate[]>
}

const candidate = (
  id: string,
  name: string,
  role: string,
  status: string,
  seniority: string,
  experience: string,
  workModel: string,
  skills: string[],
) => ({
  id,
  name,
  role,
  status,
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@email.com`,
  phone: "+55 (11) 99999-0000",
  workModel,
  seniority,
  experience,
  skills,
  linkedinUrl: `https://linkedin.com/in/${name.toLowerCase().replace(/\s+/g, "")}`,
})

const jobs: Job[] = [
  {
    id: "vaga-1",
    title: "Pessoa Desenvolvedora Front-end",
    location: "São Paulo, SP",
    team: "Produto",
    createdBy: "Mariana Oliveira",
    createdAt: "2025-01-04",
    salaryRange: "R$ 8.000 - R$ 12.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-1",
    stages: {
      novos: [candidate("c1", "Paulo Nunes", "Front-end", "Triagem inicial", "Pleno", "5 anos", "Híbrido", ["React", "TypeScript", "Next.js"])],
      rh: [candidate("c2", "Carla Neves", "Front-end", "Agendado", "Pleno", "4 anos", "Remoto", ["Design System", "React", "Jest"])],
      hm: [candidate("c3", "Vinícius Prado", "Front-end", "Teste técnico", "Sênior", "8 anos", "Híbrido", ["Next.js", "Acessibilidade", "GraphQL"])],
      oferta: [],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-2",
    title: "Engenheiro(a) de Dados",
    location: "Remoto",
    team: "Data Platform",
    createdBy: "Rafael Lima",
    createdAt: "2025-01-09",
    salaryRange: "R$ 12.000 - R$ 17.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-2",
    stages: {
      novos: [candidate("c4", "Bruno Kato", "Dados", "Novo", "Júnior", "2 anos", "Remoto", ["SQL", "Python", "dbt"])],
      rh: [candidate("c5", "Bianca Teixeira", "Dados", "Em entrevista", "Pleno", "5 anos", "Remoto", ["ETL", "Airflow", "Spark"])],
      hm: [],
      oferta: [candidate("c6", "Leandro Zago", "Dados", "Proposta enviada", "Sênior", "9 anos", "Remoto", ["AWS", "Glue", "Kafka"])],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-3",
    title: "Desenvolvedor(a) Back-end Java",
    location: "Campinas, SP",
    team: "Core Services",
    createdBy: "Aline Ribeiro",
    createdAt: "2025-01-12",
    salaryRange: "R$ 9.500 - R$ 14.500",
    reportUrl: "https://relatorios.exemplo.com/vaga-3",
    stages: {
      novos: [candidate("c7", "Gabriel Faria", "Back-end", "Triagem", "Pleno", "6 anos", "Híbrido", ["Java", "Spring", "PostgreSQL"])],
      rh: [],
      hm: [candidate("c8", "Ruan Ferraz", "Back-end", "Entrevista técnica", "Sênior", "10 anos", "Híbrido", ["Spring", "Microsserviços", "Kubernetes"])],
      oferta: [],
      contratado: [],
      rejeitado: [candidate("c9", "Talita Xavier", "Back-end", "Não aderente", "Pleno", "5 anos", "Presencial", ["Java", "Redis", "Docker"])],
    },
  },
  {
    id: "vaga-4",
    title: "Engenheiro(a) DevOps",
    location: "Belo Horizonte, MG",
    team: "Infraestrutura",
    createdBy: "Diego Cordeiro",
    createdAt: "2025-01-17",
    salaryRange: "R$ 13.000 - R$ 18.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-4",
    stages: {
      novos: [candidate("c10", "Danilo Sá", "DevOps", "Novo", "Pleno", "4 anos", "Híbrido", ["AWS", "Terraform", "CI/CD"])],
      rh: [candidate("c11", "Patrícia Camargo", "DevOps", "Em entrevista", "Sênior", "8 anos", "Remoto", ["Kubernetes", "Helm", "ArgoCD"])],
      hm: [],
      oferta: [],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-5",
    title: "QA Engineer (Automação)",
    location: "Recife, PE",
    team: "Qualidade",
    createdBy: "Renata Pires",
    createdAt: "2025-01-19",
    salaryRange: "R$ 7.500 - R$ 11.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-5",
    stages: {
      novos: [candidate("c12", "Lucas Barreto", "QA", "Novo", "Júnior", "2 anos", "Remoto", ["Cypress", "Playwright", "API Test"])],
      rh: [],
      hm: [candidate("c13", "Amanda Borges", "QA", "Teste prático", "Pleno", "5 anos", "Remoto", ["Selenium", "Java", "TestRail"])],
      oferta: [],
      contratado: [candidate("c14", "Otávio Rocha", "QA", "Admissão", "Pleno", "6 anos", "Híbrido", ["Playwright", "Node.js", "CI/CD"])],
      rejeitado: [],
    },
  },
  {
    id: "vaga-6",
    title: "UX/UI Designer de Produto",
    location: "São Paulo, SP",
    team: "Design",
    createdBy: "Juliana Freitas",
    createdAt: "2025-01-22",
    salaryRange: "R$ 8.000 - R$ 12.500",
    reportUrl: "https://relatorios.exemplo.com/vaga-6",
    stages: {
      novos: [candidate("c15", "Cecília Araújo", "UX/UI", "Novo", "Pleno", "4 anos", "Híbrido", ["Figma", "Design System", "Pesquisa"])],
      rh: [candidate("c16", "Heitor Mello", "UX/UI", "Em entrevista", "Sênior", "7 anos", "Remoto", ["UX Writing", "Prototipagem", "Métricas"])],
      hm: [],
      oferta: [],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-7",
    title: "Especialista em Segurança da Informação",
    location: "Curitiba, PR",
    team: "Security",
    createdBy: "Marcos Tadeu",
    createdAt: "2025-01-25",
    salaryRange: "R$ 14.000 - R$ 20.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-7",
    stages: {
      novos: [candidate("c17", "Fernando Goulart", "Security", "Triagem", "Sênior", "9 anos", "Híbrido", ["SOC", "SIEM", "LGPD"])],
      rh: [],
      hm: [candidate("c18", "Nathália Resende", "Security", "Entrevista técnica", "Sênior", "11 anos", "Presencial", ["OWASP", "Cloud Security", "Pentest"])],
      oferta: [],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-8",
    title: "Product Manager (TI)",
    location: "Remoto",
    team: "Produto",
    createdBy: "Camila Duarte",
    createdAt: "2025-01-27",
    salaryRange: "R$ 12.000 - R$ 16.500",
    reportUrl: "https://relatorios.exemplo.com/vaga-8",
    stages: {
      novos: [candidate("c19", "Rodrigo Simões", "Produto", "Novo", "Pleno", "6 anos", "Remoto", ["Roadmap", "Discovery", "OKR"])],
      rh: [candidate("c20", "Ariane Paes", "Produto", "Agendado", "Sênior", "8 anos", "Remoto", ["Analytics", "SQL", "Negócio"])],
      hm: [],
      oferta: [],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-9",
    title: "Cientista de Dados",
    location: "Florianópolis, SC",
    team: "Data Science",
    createdBy: "Felipe Amaral",
    createdAt: "2025-01-29",
    salaryRange: "R$ 11.000 - R$ 15.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-9",
    stages: {
      novos: [candidate("c21", "Igor Dantas", "Data Science", "Novo", "Pleno", "5 anos", "Híbrido", ["Python", "ML", "Feature Store"])],
      rh: [],
      hm: [candidate("c22", "Daniela Neri", "Data Science", "Case técnico", "Sênior", "9 anos", "Remoto", ["MLOps", "NLP", "Deep Learning"])],
      oferta: [candidate("c23", "Renan Porto", "Data Science", "Proposta enviada", "Pleno", "6 anos", "Remoto", ["Forecast", "PySpark", "Docker"])],
      contratado: [],
      rejeitado: [],
    },
  },
  {
    id: "vaga-10",
    title: "Analista de Suporte N2",
    location: "Porto Alegre, RS",
    team: "Operações",
    createdBy: "Paula Ferreira",
    createdAt: "2025-02-01",
    salaryRange: "R$ 4.500 - R$ 7.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-10",
    stages: {
      novos: [candidate("c24", "Mateus Corrêa", "Suporte", "Novo", "Júnior", "2 anos", "Presencial", ["ITIL", "Windows", "Redes"])],
      rh: [candidate("c25", "Priscila Furtado", "Suporte", "Em entrevista", "Pleno", "4 anos", "Presencial", ["Service Desk", "Atendimento", "SLA"])],
      hm: [],
      oferta: [],
      contratado: [],
      rejeitado: [candidate("c26", "Yasmin Lacerda", "Suporte", "Reprovado", "Júnior", "1 ano", "Presencial", ["Linux", "Troubleshooting", "Zabbix"])],
    },
  },
  {
    id: "vaga-11",
    title: "Arquiteto(a) de Soluções Cloud",
    location: "Rio de Janeiro, RJ",
    team: "Arquitetura",
    createdBy: "Thiago Almeida",
    createdAt: "2025-02-03",
    salaryRange: "R$ 18.000 - R$ 24.000",
    reportUrl: "https://relatorios.exemplo.com/vaga-11",
    stages: {
      novos: [candidate("c27", "Fábio Guedes", "Cloud", "Triagem", "Sênior", "12 anos", "Híbrido", ["AWS", "Azure", "Well-Architected"])],
      rh: [],
      hm: [candidate("c28", "Mirela Bastos", "Cloud", "Entrevista técnica", "Especialista", "14 anos", "Híbrido", ["Kubernetes", "FinOps", "Observabilidade"])],
      oferta: [],
      contratado: [candidate("c29", "João Venturi", "Cloud", "Admissão", "Sênior", "11 anos", "Remoto", ["Terraform", "Landing Zone", "Governança"])],
      rejeitado: [],
    },
  },
]

export default function CompanyApplicationsPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 lg:px-10">
      <header className="mb-8 rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Empresa • Candidaturas</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Pipeline de candidatos por vaga</h1>
        <p className="mt-2 text-sm text-slate-500">Acompanhe o andamento das candidaturas em cada etapa do processo seletivo.</p>
      </header>

      <section className="space-y-6">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                <p className="text-sm text-slate-500">{job.team} • {job.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(job)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Ver detalhes
              </button>
            </div>

            <div className="-mx-6 overflow-x-auto px-6">
              <div className="grid min-w-[1200px] grid-cols-6 gap-4">
                {stages.map((stage) => (
                  <div key={stage.key} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{job.stages[stage.key].length}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {job.stages[stage.key].length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-400">Sem candidatos</div>
                      ) : (
                        job.stages[stage.key].map((person) => (
                          <button
                            type="button"
                            key={person.id}
                            onClick={() => setSelectedCandidate(person)}
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-slate-900">{person.name}</h3>
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">{person.status}</span>
                            </div>
                            <p className="text-xs text-slate-500">{person.role}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      {selectedJob ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="h-[78vh] w-[78vw] overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <div className="mb-8 flex items-start justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Detalhes da vaga</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{selectedJob.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{selectedJob.team} • {selectedJob.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Número de candidatos</p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">
                  {Object.values(selectedJob.stages).reduce((total, stageCandidates) => total + stageCandidates.length, 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Criador da vaga</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.createdBy}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Data de criação</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.createdAt}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Faixa salarial</p>
                <p className="mt-2 text-base font-semibold text-slate-800">{selectedJob.salaryRange}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 md:col-span-2 xl:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Download de relatório</p>
                <a href={selectedJob.reportUrl} className="mt-2 inline-block text-sm font-semibold text-blue-600 underline decoration-blue-200 underline-offset-4">
                  {selectedJob.reportUrl}
                </a>
                <p className="mt-2 text-xs text-slate-500">Link ilustrativo sem ação para visualização de layout.</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Perfil do candidato</p>
                <h2 className="text-2xl font-semibold text-slate-900">{selectedCandidate.name}</h2>
                <p className="text-sm text-slate-500">{selectedCandidate.role}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p><p className="text-sm font-medium text-slate-700">{selectedCandidate.email}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Telefone</p><p className="text-sm font-medium text-slate-700">{selectedCandidate.phone}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modelo de trabalho</p><p className="text-sm font-medium text-slate-700">{selectedCandidate.workModel}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Senioridade</p><p className="text-sm font-medium text-slate-700">{selectedCandidate.seniority}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Experiência</p><p className="text-sm font-medium text-slate-700">{selectedCandidate.experience}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">LinkedIn</p>
                <a href={selectedCandidate.linkedinUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-slate-700 underline decoration-slate-200 underline-offset-4 hover:text-slate-900">{selectedCandidate.linkedinUrl}</a>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCandidate.skills.map((skill) => (
                  <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{skill}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
