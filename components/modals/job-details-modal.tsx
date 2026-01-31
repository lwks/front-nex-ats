"use client"

import Link from "next/link"
import { useEffect } from "react"

import { Button } from "../ui/button"

type CompanyDetails = {
  segment?: string
  industry?: string
  website?: string
  companyWebsite?: string
  contactEmail?: string
}

type JobDetails = {
  id: string
  title: string
  company: string
  location: string
  workType: string
  description: string
  applyHref: string
  isExternal: boolean
  companyDetails: CompanyDetails
}

type JobDetailsModalProps = {
  job: JobDetails | null
  onClose: () => void
}

const COMPANY_DETAIL_FIELDS = [
  { label: "Segmento", key: "segment" },
  { label: "Ramo de atuação", key: "industry" },
  { label: "Site", key: "website" },
  { label: "Site da empresa", key: "companyWebsite" },
  { label: "Email para contato", key: "contactEmail" },
] as const

function renderDetailValue(value?: string) {
  if (!value) {
    return <span className="text-muted-foreground">Não informado</span>
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return (
      <a className="text-primary underline" href={value} rel="noreferrer" target="_blank">
        {value}
      </a>
    )
  }

  return <span>{value}</span>
}

export function JobDetailsModal({ job, onClose }: JobDetailsModalProps) {
  useEffect(() => {
    if (!job) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [job, onClose])

  if (!job) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl max-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-3xl bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-8 py-6">
          <div>
            <p className="text-sm font-semibold text-primary">{job.company}</p>
            <h3 className="mt-1 text-2xl font-semibold text-foreground">{job.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {job.location} • {job.workType}
            </p>
          </div>
          <Button variant="ghost" type="button" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <h4 className="text-lg font-semibold text-foreground">Descrição da vaga</h4>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-6">
            <h4 className="text-base font-semibold text-foreground">Informações da empresa</h4>
            <dl className="mt-4 space-y-4 text-sm">
              {COMPANY_DETAIL_FIELDS.map((field) => (
                <div key={field.key}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {field.label}
                  </dt>
                  <dd className="mt-1 text-foreground">
                    {renderDetailValue(job.companyDetails[field.key])}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-8 py-6 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" type="button" onClick={onClose}>
            Voltar para lista
          </Button>
          <Button asChild className="rounded-full">
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
      </div>
    </div>
  )
}
