"use client"

import type { DragEvent } from "react"
import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

export type ApplicationStatus =
  | "novos"
  | "entrevista-rh"
  | "entrevista-tecnica"
  | "proposta"
  | "contratado"

export type Application = {
  id: string
  nome: string
  cargo?: string
  email?: string
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
  onStatusChange?: (id: string, status: ApplicationStatus) => void
}

const defaultColumns: ApplicationColumn[] = [
  { id: "novos", titulo: "Novos Candidatos" },
  { id: "entrevista-rh", titulo: "Entrevista RH" },
  { id: "entrevista-tecnica", titulo: "Entrevista Técnica" },
  { id: "proposta", titulo: "Proposta" },
  { id: "contratado", titulo: "Contratado" },
]

export function ApplicationBoard({
  candidaturas,
  colunas = defaultColumns,
  onStatusChange,
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
    event.dataTransfer.setData("text/plain", application.id)
    event.dataTransfer.effectAllowed = "move"
    setDraggedId(application.id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setActiveColumn(null)
  }

  const handleDrop = (columnId: ApplicationStatus) => (event: DragEvent<HTMLDivElement>) => {
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
            activeColumn === column.id && "border-primary/70 bg-primary/5",
          )}
          onDragOver={handleDragOver(column.id)}
          onDrop={handleDrop(column.id)}
          onDragLeave={() => setActiveColumn(null)}
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
                draggable
                onDragStart={handleDragStart(application)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "cursor-grab rounded-xl border border-border bg-background p-3 shadow-sm transition active:cursor-grabbing",
                  draggedId === application.id && "opacity-60",
                )}
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
                Arraste candidatos para esta etapa.
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}
