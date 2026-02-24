"use client"

import type { DragEvent } from "react"
import { useEffect, useMemo, useState } from "react"

import { fetchCandidatesByJobGuid } from "@/services/candidates-by-job-guids-service"
import { cn } from "@/lib/utils"

export type ApplicationStatus =
  | "novos"
  | "entrevista-rh"
  | "entrevista-tecnica"
  | "proposta"
  | "contratado"
  | "rejeitado"

export type Application = {
  id: string
  nome: string
  cargo?: string
  email?: string
  telefone?: string
  modeloTrabalho?: string
  senioridade?: string
  experiencia?: string
  skills?: string[]
  linkedinUrl?: string
  status: ApplicationStatus | string
  atualizadoEm?: string
}

export type ApplicationColumn = {
  id: ApplicationStatus
  titulo: string
  descricao?: string
}

type ApplicationBoardProps = {
  candidaturas: Application[]
  colunas?: ApplicationColumn[]
  draggable?: boolean
  onStatusChange?: (id: string, status: ApplicationStatus) => void
  onApplicationSelect?: (application: Application) => void
}

type ApplicationBoardFromApiProps = {
  guidVaga: string
  colunas?: ApplicationColumn[]
  draggable?: boolean
  onStatusChange?: (id: string, status: ApplicationStatus) => void
  onApplicationSelect?: (application: Application) => void
}

const defaultColumns: ApplicationColumn[] = [
  { id: "novos", titulo: "Novos Candidatos" },
  { id: "entrevista-rh", titulo: "Entrevista RH" },
  { id: "entrevista-tecnica", titulo: "Entrevista Técnica" },
  { id: "proposta", titulo: "Proposta" },
  { id: "contratado", titulo: "Contratado" },
  { id: "rejeitado", titulo: "Rejeitado" },
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

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

function pickStringArray(...values: Array<unknown>) {
  for (const value of values) {
    if (Array.isArray(value)) {
      return value
        .map((item) => pickString(item))
        .filter((item): item is string => Boolean(item))
    }

    if (typeof value === "string") {
      const splitValues = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
      if (splitValues.length > 0) {
        return splitValues
      }
    }
  }

  return undefined
}

function normalizeText(value?: string) {
  if (!value) return ""
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

export function mapApiStatusToBoardStatus(statusValue?: string): ApplicationStatus {
  const normalized = normalizeText(statusValue)

  if (
    normalized.includes("rejeitado") ||
    normalized.includes("reprovado") ||
    normalized.includes("nao aderente")
  ) {
    return "rejeitado"
  }

  if (normalized.includes("contratado") || normalized.includes("admissao") || normalized.includes("hired")) {
    return "contratado"
  }

  if (normalized.includes("oferta") || normalized.includes("proposta")) {
    return "proposta"
  }

  if (
    normalized.includes("tecnica") ||
    normalized === "hm" ||
    normalized.includes("gestor") ||
    normalized.includes("case") ||
    normalized.includes("teste")
  ) {
    return "entrevista-tecnica"
  }

  if (normalized === "rh" || normalized.includes("recrutador") || normalized.includes("people")) {
    return "entrevista-rh"
  }

  if (
    normalized.includes("novo") ||
    normalized.includes("triagem") ||
    normalized.includes("curriculo") ||
    normalized.includes("inicial")
  ) {
    return "novos"
  }

  return "novos"
}

function extractCandidateItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (!isRecord(payload)) {
    return []
  }

  const container = payload as Record<string, unknown>
  const collectionKeys = ["items", "results", "data", "candidatos", "candidates", "content"]

  for (const key of collectionKeys) {
    const value = container[key]
    if (Array.isArray(value)) {
      return value
    }
  }

  for (const value of Object.values(container)) {
    if (Array.isArray(value)) {
      return value
    }
    if (isRecord(value)) {
      const nested = extractCandidateItems(value)
      if (nested.length > 0) {
        return nested
      }
    }
  }

  return []
}

function normalizeCandidate(item: unknown, index: number): Application | null {
  if (!isRecord(item)) {
    return null
  }

  const id = pickString(item.guid_id, item.id, item.codigo, item.pk) ?? `candidato-${index}`
  const nome = pickString(item.nome, item.name, item.candidato, item.nome_candidato, item.fullName)
  if (!nome) {
    return null
  }

  const rawStatus = pickString(item.status, item.etapa, item.stage, item.situacao, item.situation)

  return {
    id,
    nome,
    cargo: pickString(item.cargo, item.role, item.vaga, item.titulo_vaga),
    email: pickString(item.email, item.cd_email),
    telefone: pickString(item.telefone, item.phone, item.cd_telefone),
    modeloTrabalho: pickString(item.modelo_trabalho, item.workModel, item.modalidade),
    senioridade: pickString(item.senioridade, item.seniority, item.nivel),
    experiencia: pickString(item.experiencia, item.experience),
    linkedinUrl: pickString(item.linkedin, item.linkedinUrl, item.linkedin_url),
    skills: pickStringArray(item.skills, item.habilidades),
    status: mapApiStatusToBoardStatus(rawStatus),
    atualizadoEm: pickString(item.updatedAt, item.updated_at, item.atualizadoEm),
  }
}

export function ApplicationBoard({
  candidaturas,
  colunas = defaultColumns,
  draggable = true,
  onStatusChange,
  onApplicationSelect,
}: ApplicationBoardProps) {
  const [boardApplications, setBoardApplications] = useState<Application[]>(candidaturas)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState<ApplicationStatus | null>(null)

  useEffect(() => {
    setBoardApplications(candidaturas)
  }, [candidaturas])

  const groupedApplications = useMemo(() => {
    return colunas.reduce<Record<ApplicationStatus, Application[]>>((acc, column) => {
      acc[column.id] = boardApplications.filter((application) => application.status === column.id)
      return acc
    }, {} as Record<ApplicationStatus, Application[]>)
  }, [boardApplications, colunas])

  const handleDragStart = (application: Application) => (event: DragEvent<HTMLDivElement>) => {
    if (!draggable) return
    event.dataTransfer.setData("text/plain", application.id)
    event.dataTransfer.effectAllowed = "move"
    setDraggedId(application.id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setActiveColumn(null)
  }

  const handleDrop = (columnId: ApplicationStatus) => (event: DragEvent<HTMLDivElement>) => {
    if (!draggable) return

    event.preventDefault()
    const applicationId = event.dataTransfer.getData("text/plain")
    if (!applicationId) return

    setBoardApplications((prev) =>
      prev.map((application) =>
        application.id === applicationId ? { ...application, status: columnId } : application,
      ),
    )

    onStatusChange?.(applicationId, columnId)
    setActiveColumn(null)
  }

  const handleDragOver = (columnId: ApplicationStatus) => (event: DragEvent<HTMLDivElement>) => {
    if (!draggable) return
    event.preventDefault()
    setActiveColumn(columnId)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      {colunas.map((column) => (
        <div
          key={column.id}
          className={cn(
            "flex min-h-[320px] flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition",
            draggable && activeColumn === column.id && "border-primary/70 bg-primary/5",
          )}
          onDragOver={handleDragOver(column.id)}
          onDrop={handleDrop(column.id)}
          onDragLeave={() => draggable && setActiveColumn(null)}
        >
          <header className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{column.titulo}</h3>
            {column.descricao ? (
              <p className="text-xs text-muted-foreground">{column.descricao}</p>
            ) : null}
            <span className="text-xs font-medium text-muted-foreground">
              {groupedApplications[column.id]?.length ?? 0} candidato(s)
            </span>
          </header>

          <div className="flex flex-1 flex-col gap-3">
            {groupedApplications[column.id]?.map((application) => (
              <div
                key={application.id}
                draggable={draggable}
                onDragStart={handleDragStart(application)}
                onDragEnd={handleDragEnd}
                onClick={() => onApplicationSelect?.(application)}
                className={cn(
                  "rounded-xl border border-border bg-background p-3 shadow-sm transition",
                  draggable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                  draggedId === application.id && "opacity-60",
                )}
                role={onApplicationSelect ? "button" : undefined}
                tabIndex={onApplicationSelect ? 0 : undefined}
                onKeyDown={
                  onApplicationSelect
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          onApplicationSelect(application)
                        }
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{application.nome}</p>
                    {application.cargo ? (
                      <p className="text-xs text-muted-foreground">{application.cargo}</p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {column.titulo}
                  </span>
                </div>
                {application.email ? (
                  <p className="mt-2 text-xs text-muted-foreground">{application.email}</p>
                ) : null}
                {application.atualizadoEm ? (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Atualizado em {application.atualizadoEm}
                  </p>
                ) : null}
              </div>
            ))}
            {groupedApplications[column.id]?.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                Sem candidatos nesta etapa.
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}

export function ApplicationBoardFromApi({
  guidVaga,
  colunas = defaultColumns,
  draggable = true,
  onStatusChange,
  onApplicationSelect,
}: ApplicationBoardFromApiProps) {
  const [candidaturas, setCandidaturas] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadCandidates() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const payload = await fetchCandidatesByJobGuid(guidVaga)
        const normalized = extractCandidateItems(payload)
          .map((item, index) => normalizeCandidate(item, index))
          .filter((item): item is Application => item !== null)

        if (active) {
          setCandidaturas(normalized)
        }
      } catch (error) {
        if (active) {
          setCandidaturas([])
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os candidatos no momento.",
          )
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadCandidates()

    return () => {
      active = false
    }
  }, [guidVaga])

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Carregando candidatos...
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
        {errorMessage}
      </div>
    )
  }

  if (candidaturas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Nenhum candidato encontrado para a vaga selecionada.
      </div>
    )
  }

  return (
    <ApplicationBoard
      candidaturas={candidaturas}
      colunas={colunas}
      draggable={draggable}
      onStatusChange={onStatusChange}
      onApplicationSelect={onApplicationSelect}
    />
  )
}
