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
  stages: Record<StageKey, Candidate[]>
}

const jobs: Job[] = [
  {
    id: "vaga-1",
    title: "Pessoa Desenvolvedora Front-end",
    location: "São Paulo, SP",
    team: "Produto",
    stages: {
      novos: [
        {
          id: "c1",
          name: "Mariana Lopes",
          role: "Front-end",
          status: "Triagem inicial",
          email: "mariana.lopes@email.com",
          phone: "+55 (11) 99555-1122",
          workModel: "Híbrido",
          seniority: "Pleno",
          experience: "5 anos",
          skills: ["React", "TypeScript", "CSS"],
          linkedinUrl: "https://linkedin.com/in/marianalopes",
        },
        {
          id: "c2",
          name: "Diego Batista",
          role: "Front-end",
          status: "CV analisado",
          email: "diego.batista@email.com",
          phone: "+55 (11) 99123-4444",
          workModel: "Híbrido",
          seniority: "Pleno",
          experience: "5 anos",
          skills: ["React", "TypeScript", "Next.js"],
          linkedinUrl: "https://linkedin.com/in/diegobatista",
        },
      ],
      rh: [
        {
          id: "c3",
          name: "Isabela Mendes",
          role: "Front-end",
          status: "Agendado",
          email: "isabela.mendes@email.com",
          phone: "+55 (11) 99877-5566",
          workModel: "Remoto",
          seniority: "Sênior",
          experience: "8 anos",
          skills: ["Vue", "Design Systems", "Liderança técnica"],
          linkedinUrl: "https://linkedin.com/in/isabelamendes",
        },
      ],
      hm: [
        {
          id: "c4",
          name: "Renato Gomes",
          role: "Front-end",
          status: "Aguardando retorno",
          email: "renato.gomes@email.com",
          phone: "+55 (11) 97888-9900",
          workModel: "Híbrido",
          seniority: "Pleno",
          experience: "6 anos",
          skills: ["React", "UI/UX", "Acessibilidade"],
          linkedinUrl: "https://linkedin.com/in/renatogomes",
        },
      ],
      oferta: [
        {
          id: "c5",
          name: "Joana Silveira",
          role: "Front-end",
          status: "Proposta enviada",
          email: "joana.silveira@email.com",
          phone: "+55 (11) 97777-1212",
          workModel: "Remoto",
          seniority: "Pleno",
          experience: "4 anos",
          skills: ["React", "Storybook", "Cypress"],
          linkedinUrl: "https://linkedin.com/in/joanasilveira",
        },
      ],
      contratado: [
        {
          id: "c6",
          name: "Eduardo Paiva",
          role: "Front-end",
          status: "Admissão",
          email: "eduardo.paiva@email.com",
          phone: "+55 (11) 98999-0101",
          workModel: "Presencial",
          seniority: "Júnior",
          experience: "2 anos",
          skills: ["HTML", "CSS", "JavaScript"],
          linkedinUrl: "https://linkedin.com/in/eduardopaiva",
        },
      ],
      rejeitado: [
        {
          id: "c7",
          name: "Paula Regina",
          role: "Front-end",
          status: "Reprovado",
          email: "paula.regina@email.com",
          phone: "+55 (11) 96666-3344",
          workModel: "Remoto",
          seniority: "Pleno",
          experience: "5 anos",
          skills: ["Angular", "TypeScript", "RxJS"],
          linkedinUrl: "https://linkedin.com/in/paulareginaa",
        },
      ],
    },
  },
  {
    id: "vaga-2",
    title: "Analista de Dados",
    location: "Remoto",
    team: "BI",
    stages: {
      novos: [
        {
          id: "c8",
          name: "Bruno Mota",
          role: "Dados",
          status: "Novo",
          email: "bruno.mota@email.com",
          phone: "+55 (21) 98888-2222",
          workModel: "Remoto",
          seniority: "Júnior",
          experience: "1 ano",
          skills: ["SQL", "Power BI", "Python"],
          linkedinUrl: "https://linkedin.com/in/brunomota",
        },
      ],
      rh: [
        {
          id: "c9",
          name: "Larissa Costa",
          role: "Dados",
          status: "Em entrevista",
          email: "larissa.costa@email.com",
          phone: "+55 (21) 97777-9898",
          workModel: "Híbrido",
          seniority: "Pleno",
          experience: "4 anos",
          skills: ["SQL", "Looker", "Modelagem"],
          linkedinUrl: "https://linkedin.com/in/larissacosta",
        },
        {
          id: "c10",
          name: "Felipe Souza",
          role: "Dados",
          status: "Agendado",
          email: "felipe.souza@email.com",
          phone: "+55 (21) 96666-1010",
          workModel: "Remoto",
          seniority: "Pleno",
          experience: "3 anos",
          skills: ["Python", "ETL", "Airflow"],
          linkedinUrl: "https://linkedin.com/in/felipesouza",
        },
      ],
      hm: [
        {
          id: "c11",
          name: "Gisele Andrade",
          role: "Dados",
          status: "Teste técnico",
          email: "gisele.andrade@email.com",
          phone: "+55 (21) 95555-2323",
          workModel: "Remoto",
          seniority: "Sênior",
          experience: "7 anos",
          skills: ["Data Science", "Machine Learning", "Python"],
          linkedinUrl: "https://linkedin.com/in/giseleandrade",
        },
      ],
      oferta: [],
      contratado: [],
      rejeitado: [
        {
          id: "c12",
          name: "Carlos Nunes",
          role: "Dados",
          status: "Não avançou",
          email: "carlos.nunes@email.com",
          phone: "+55 (21) 94444-5656",
          workModel: "Híbrido",
          seniority: "Pleno",
          experience: "4 anos",
          skills: ["SQL", "Tableau", "Estatística"],
          linkedinUrl: "https://linkedin.com/in/carlosnunes",
        },
      ],
    },
  },
]

export default function CandidateApplicationPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <header className="mx-auto mb-8 flex w-full max-w-6xl flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
          Candidaturas
        </span>
        <h1 className="text-3xl font-semibold text-slate-900">
          Pipeline de candidatos por vaga
        </h1>
        <p className="text-sm text-slate-500">
          Acompanhe o andamento das candidaturas em cada etapa do processo seletivo.
        </p>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{job.title}</h2>
                <p className="text-sm text-slate-500">
                  {job.team} • {job.location}
                </p>
              </div>
              <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700">
                Ver detalhes
              </button>
            </div>

            <div className="-mx-6 overflow-x-auto px-6">
              <div className="grid min-w-[1200px] grid-cols-6 gap-4">
                {stages.map((stage) => (
                  <div key={stage.key} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">{stage.label}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                        {job.stages[stage.key].length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3">
                      {job.stages[stage.key].length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs font-medium text-slate-400">
                          Sem candidatos
                        </div>
                      ) : (
                        job.stages[stage.key].map((candidate) => (
                            <button
                              type="button"
                              key={candidate.id}
                              onClick={() => setSelectedCandidate(candidate)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-900">{candidate.name}</h3>
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                  {candidate.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{candidate.role}</p>
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

      {selectedCandidate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Perfil do candidato
                </p>
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
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
                <p className="text-sm font-medium text-slate-700">{selectedCandidate.email}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Telefone</p>
                <p className="text-sm font-medium text-slate-700">{selectedCandidate.phone}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modelo de trabalho</p>
                <p className="text-sm font-medium text-slate-700">{selectedCandidate.workModel}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Senioridade</p>
                <p className="text-sm font-medium text-slate-700">{selectedCandidate.seniority}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Experiência</p>
                <p className="text-sm font-medium text-slate-700">{selectedCandidate.experience}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">LinkedIn</p>
                <a
                  href={selectedCandidate.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-slate-700 underline decoration-slate-200 underline-offset-4 hover:text-slate-900"
                >
                  {selectedCandidate.linkedinUrl}
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Skills</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedCandidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
