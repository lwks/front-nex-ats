import { describe, expect, it } from "vitest"

import {
  buildJobApplicationHref,
  filterJobBoardJobs,
  mergeJobBoardJobs,
  normalizeJobBoardPage,
} from "@/lib/job-board"

describe("job board normalization", () => {
  it("maps a full API payload into the public job board view model", () => {
    const payload = {
      data: {
        items: [
          {
            id: "job-1",
            guid_id: "guid-1",
            titulo: "Pessoa Desenvolvedora Front-end",
            empresa: "ClusterHR",
            cidade: "São Paulo",
            estado: "SP",
            modelo_trabalho: "Remoto",
            formato_contratacao: "CLT",
            exibir_salario: true,
            descricao: "Construção de experiências web.",
            skills: ["React", "TypeScript"],
            beneficios: ["VR", "Plano de saúde"],
            requisitos: ["3+ anos com React"],
            responsabilidades: ["Evoluir a plataforma"],
            orcamento: {
              valor_inicial: 8000,
              valor_final: 12000,
            },
          },
        ],
        lastKey: "cursor-1",
      },
    }

    expect(normalizeJobBoardPage(payload)).toEqual({
      jobs: [
        {
          id: "job-1",
          guid: "guid-1",
          title: "Pessoa Desenvolvedora Front-end",
          company: "ClusterHR",
          location: "São Paulo/SP",
          workType: "Remoto",
          contractType: "CLT",
          salary: "R$ 8.000 - R$ 12.000",
          description: "Construção de experiências web.",
          skills: ["React", "TypeScript"],
          benefits: ["VR", "Plano de saúde"],
          requirements: ["3+ anos com React"],
          responsibilities: ["Evoluir a plataforma"],
          applyHref: "/candidaturas?vagaGuid=guid-1",
        },
      ],
      lastKey: "cursor-1",
    })
  })

  it("supports mixed aliases and hides salary when the API does not expose it", () => {
    const payload = {
      data: {
        items: [
          {
            codigo: "job-2",
            title: "Analista de Dados",
            company: "Empresa XPTO",
            localizacao: "Belo Horizonte/MG",
            modalidade: "Híbrido",
            tipoContratacao: "PJ",
            summary: "Análise orientada a produto.",
            technicalSkills: "SQL, Python",
            benefits: "PLR, Gympass",
            requirements: "Power BI",
            responsibilities: "Criar dashboards",
            orcamento: {
              valor_inicial: 5000,
              valor_final: 7000,
            },
          },
        ],
      },
    }

    const normalized = normalizeJobBoardPage(payload)

    expect(normalized.jobs[0]).toMatchObject({
      id: "job-2",
      guid: null,
      title: "Analista de Dados",
      company: "Empresa XPTO",
      location: "Belo Horizonte/MG",
      workType: "Híbrido",
      contractType: "PJ",
      salary: "Salário a combinar",
      skills: ["SQL", "Python"],
      benefits: ["PLR", "Gympass"],
      requirements: ["Power BI"],
      responsibilities: ["Criar dashboards"],
    })
  })

  it("falls back safely when salary and optional modal sections are absent", () => {
    const payload = {
      data: {
        items: [
          {
            id: "job-3",
            nome: "UX Designer",
            nome_empresa: "Empresa confidencial",
            localizacao: "12345678",
          },
        ],
      },
    }

    expect(normalizeJobBoardPage(payload)).toEqual({
      jobs: [
        {
          id: "job-3",
          guid: null,
          title: "UX Designer",
          company: "Empresa confidencial",
          location: "Localização não informada",
          workType: "Modelo de trabalho não informado",
          contractType: "Contrato não informado",
          salary: "Salário a combinar",
          description: "Descrição indisponível no momento.",
          skills: [],
          benefits: [],
          requirements: [],
          responsibilities: [],
          applyHref: "/candidaturas?vaga=job-3",
        },
      ],
      lastKey: null,
    })
  })
})

describe("job board helpers", () => {
  const jobs = normalizeJobBoardPage({
    data: {
      items: [
        {
          id: "job-1",
          guid_id: "guid-1",
          titulo: "Desenvolvedor Python",
          empresa: "ClusterHR",
          cidade: "São Paulo",
          estado: "SP",
          descricao: "APIs e automação",
          skills: ["Python"],
        },
        {
          id: "job-2",
          titulo: "UX Designer",
          empresa: "Design Lab",
          localizacao: "Rio de Janeiro/RJ",
          descricao: "Pesquisa com candidatos",
          skills: ["Figma"],
        },
      ],
    },
  }).jobs

  it("filters jobs by title, description, company and skills", () => {
    expect(filterJobBoardJobs(jobs, "python").map((job) => job.id)).toEqual(["job-1"])
    expect(filterJobBoardJobs(jobs, "automacao").map((job) => job.id)).toEqual(["job-1"])
    expect(filterJobBoardJobs(jobs, "design lab").map((job) => job.id)).toEqual(["job-2"])
    expect(filterJobBoardJobs(jobs, "figma").map((job) => job.id)).toEqual(["job-2"])
  })

  it("merges paged results without duplicating existing jobs", () => {
    const mergedJobs = mergeJobBoardJobs(jobs, [
      {
        ...jobs[1],
        title: "UX/UI Designer",
      },
      {
        ...jobs[0],
        id: "job-3",
        guid: "guid-3",
        title: "Analista de Produto",
        applyHref: "/candidaturas?vagaGuid=guid-3",
      },
    ])

    expect(mergedJobs.map((job) => job.id)).toEqual(["job-1", "job-2", "job-3"])
    expect(mergedJobs[1].title).toBe("UX/UI Designer")
  })

  it("builds the apply href using guid when available and id as fallback", () => {
    expect(buildJobApplicationHref("job-1", "guid-1")).toBe("/candidaturas?vagaGuid=guid-1")
    expect(buildJobApplicationHref("job-1", null)).toBe("/candidaturas?vaga=job-1")
  })
})
