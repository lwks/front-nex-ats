import Link from "next/link"

import { Header } from "./header"
import { Button } from "./ui/button"

const JOB_OPENINGS = [
  {
    id: "product-manager",
    title: "Product Manager Senior",
    company: "NEXJOB",
    location: "Remoto - Brasil",
    workType: "Tempo integral",
    description:
      "Lidere squads multidisciplinares na construção de experiências digitais centradas no usuário e impulsione o roadmap de produtos estratégicos.",
  },
  {
    id: "ux-designer",
    title: "UX/UI Designer Pleno",
    company: "NEXJOB",
    location: "São Paulo/SP (Híbrido)",
    workType: "Tempo integral",
    description:
      "Desenvolva protótipos e pesquisas com usuários para criar jornadas encantadoras em produtos que impactam milhares de pessoas.",
  },
  {
    id: "software-engineer",
    title: "Software Engineer Front-end",
    company: "NEXJOB",
    location: "Remoto - Brasil",
    workType: "Tempo integral",
    description:
      "Construa interfaces performáticas com React e Next.js, colaborando em um ambiente ágil e orientado a resultados.",
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    company: "NEXJOB",
    location: "Belo Horizonte/MG (Híbrido)",
    workType: "Tempo integral",
    description:
      "Monitore indicadores de negócio, estruture dashboards e apoie times na tomada de decisões baseada em dados.",
  },
] as const

export function JobListings() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-12">
        <header className="mb-12 text-center md:text-left">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">Encontre sua próxima oportunidade</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Vagas em destaque na NEXJOB
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:w-2/3">
            Explore as oportunidades disponíveis e escolha aquela que mais combina com o seu momento profissional. Ao se
            candidatar você será redirecionado para completar o cadastro.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {JOB_OPENINGS.map((job) => (
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
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{job.description}</p>
              </div>

              <div className="mt-6">
                <Button asChild className="w-full rounded-full md:w-auto">
                  <Link href={`/candidaturas?vaga=${job.id}`}>Candidatar-se</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
