import { describe, expect, it } from "vitest"

import {
  buildAtsReportMetrics,
  normalizeReportCandidates,
  normalizeReportJobs,
  type ReportCandidate,
  type ReportJob,
} from "@/lib/ats-report"

function createJob(overrides: Partial<ReportJob> = {}): ReportJob {
  return {
    id: "job-1",
    jobGuid: "guid-1",
    title: "Pessoa Desenvolvedora",
    location: "Sao Paulo",
    workType: "CLT",
    ...overrides,
  }
}

function createCandidate(overrides: Partial<ReportCandidate> = {}): ReportCandidate {
  return {
    id: "cand-1",
    jobGuid: "guid-1",
    stage: "Novos",
    ...overrides,
  }
}

describe("ats-report helpers", () => {
  it("normalizes jobs from nested collections", () => {
    const payload = {
      data: {
        items: [
          { id: "job-1", guid_id: "guid-1", titulo: "Pessoa Desenvolvedora", localizacao: "Sao Paulo", modalidade: "CLT" },
          { id: "job-2", title: "Analista de Dados", guid_id: "guid-2", city: "Recife", workType: "Hibrido" },
          { id: "job-3", titulo: "", guid_id: "guid-3" },
        ],
      },
    }

    expect(normalizeReportJobs(payload)).toEqual([
      createJob(),
      createJob({
        id: "job-2",
        jobGuid: "guid-2",
        title: "Analista de Dados",
        location: "Recife",
        workType: "Hibrido",
      }),
    ])
  })

  it("normalizes candidates and ignores items without guid_vaga", () => {
    const payload = {
      results: [
        { id: "cand-1", guid_vaga: "guid-1", etapa: "triagem inicial" },
        { id: "cand-2", vagaGuid: "guid-1", status: "entrevista tecnica" },
        { id: "cand-3", status: "proposta" },
      ],
    }

    expect(normalizeReportCandidates(payload)).toEqual([
      createCandidate(),
      createCandidate({ id: "cand-2", stage: "Entrevista tecnica" }),
    ])
  })

  it("builds consolidated metrics with candidates per job, stage and coverage", () => {
    const jobs = [
      createJob(),
      createJob({ id: "job-2", jobGuid: "guid-2", title: "Analista de Dados" }),
      createJob({ id: "job-3", jobGuid: "guid-3", title: "UX Designer" }),
    ]
    const candidates = [
      createCandidate(),
      createCandidate({ id: "cand-2", stage: "Entrevista RH" }),
      createCandidate({ id: "cand-3", jobGuid: "guid-2", stage: "Proposta" }),
      createCandidate({ id: "cand-4", jobGuid: "guid-outside", stage: "Novos" }),
    ]

    expect(buildAtsReportMetrics(jobs, candidates)).toMatchObject({
      totalOpenJobs: 3,
      totalCandidates: 3,
      selectedJobTitle: null,
      candidatesPerJob: [
        { label: "Pessoa Desenvolvedora", value: 2 },
        { label: "Analista de Dados", value: 1 },
      ],
      candidatesByStage: [
        { label: "Novos", value: 1 },
        { label: "Entrevista RH", value: 1 },
        { label: "Proposta", value: 1 },
      ],
      jobsCoverage: [
        { label: "Vagas com candidatos", value: 2 },
        { label: "Vagas sem candidatos", value: 1 },
      ],
    })
  })

  it("recalculates metrics for a selected job only", () => {
    const jobs = [
      createJob(),
      createJob({ id: "job-2", jobGuid: "guid-2", title: "Analista de Dados" }),
    ]
    const candidates = [
      createCandidate({ id: "cand-1", stage: "Novos" }),
      createCandidate({ id: "cand-2", stage: "Contratado" }),
      createCandidate({ id: "cand-3", jobGuid: "guid-2", stage: "Proposta" }),
    ]

    expect(buildAtsReportMetrics(jobs, candidates, "guid-2")).toMatchObject({
      totalOpenJobs: 1,
      totalCandidates: 1,
      selectedJobTitle: "Analista de Dados",
      candidatesPerJob: [{ label: "Analista de Dados", value: 1 }],
      candidatesByStage: [{ label: "Proposta", value: 1 }],
      jobsCoverage: [
        { label: "Vagas com candidatos", value: 1 },
        { label: "Vagas sem candidatos", value: 0 },
      ],
    })
  })

  it("keeps empty metrics when there is no data", () => {
    expect(buildAtsReportMetrics([], [])).toMatchObject({
      totalOpenJobs: 0,
      totalCandidates: 0,
      selectedJobTitle: null,
      candidatesPerJob: [],
      candidatesByStage: [],
      jobsCoverage: [],
    })
  })
})
