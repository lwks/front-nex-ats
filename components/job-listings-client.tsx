"use client"

import { useState } from "react"

import { JobDetailsModal } from "./modals/job-details-modal"
import { Button } from "./ui/button"

type CompanyDetails = {
  segment?: string
  industry?: string
  website?: string
  companyWebsite?: string
  contactEmail?: string
}

type JobCard = {
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

type JobListingsClientProps = {
  jobs: JobCard[]
}

export function JobListingsClient({ jobs }: JobListingsClientProps) {
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null)

  return (
    <>
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
              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            </div>

            <div className="mt-6">
              <Button className="w-full rounded-full md:w-auto" onClick={() => setSelectedJob(job)}>
                Ver mais
              </Button>
            </div>
          </article>
        ))}
      </section>

      <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  )
}
