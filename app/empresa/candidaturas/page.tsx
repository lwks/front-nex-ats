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
        { id: "c1", name: "Mariana Lopes", role: "Front-end", status: "Triagem inicial" },
        { id: "c2", name: "Diego Batista", role: "Front-end", status: "CV analisado" },
      ],
      rh: [{ id: "c3", name: "Isabela Mendes", role: "Front-end", status: "Agendado" }],
      hm: [{ id: "c4", name: "Renato Gomes", role: "Front-end", status: "Aguardando retorno" }],
      oferta: [{ id: "c5", name: "Joana Silveira", role: "Front-end", status: "Proposta enviada" }],
      contratado: [{ id: "c6", name: "Eduardo Paiva", role: "Front-end", status: "Admissão" }],
      rejeitado: [{ id: "c7", name: "Paula Regina", role: "Front-end", status: "Reprovado" }],
    },
  },
  {
    id: "vaga-2",
    title: "Analista de Dados",
    location: "Remoto",
    team: "BI",
    stages: {
      novos: [{ id: "c8", name: "Bruno Mota", role: "Dados", status: "Novo" }],
      rh: [
        { id: "c9", name: "Larissa Costa", role: "Dados", status: "Em entrevista" },
        { id: "c10", name: "Felipe Souza", role: "Dados", status: "Agendado" },
      ],
      hm: [{ id: "c11", name: "Gisele Andrade", role: "Dados", status: "Teste técnico" }],
      oferta: [],
      contratado: [],
      rejeitado: [{ id: "c12", name: "Carlos Nunes", role: "Dados", status: "Não avançou" }],
    },
  },
]

export default function CandidateApplicationPage() {
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
                          <div
                            key={candidate.id}
                            className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-slate-900">{candidate.name}</h3>
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                                {candidate.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{candidate.role}</p>
                          </div>
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
    </div>
  )
}
