"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { usePathname } from "next/navigation"

import { ANALYTICS_CONSENT_KEY, captureEvent, disableAnalytics, enableAnalytics, isAnalyticsConfigured } from "@/lib/analytics"

type Consent = "accepted" | "rejected" | null
const CONSENT_CHANGED = "clusterhr:analytics-consent-changed"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CONSENT_CHANGED, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CONSENT_CHANGED, onChange)
  }
}

function getConsent(): Consent {
  const saved = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
  return saved === "accepted" || saved === "rejected" ? saved : null
}

export function AnalyticsConsent() {
  const pathname = usePathname()
  const consent = useSyncExternalStore<Consent | undefined>(subscribe, getConsent, () => undefined)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (consent === "accepted") enableAnalytics()
    if (consent === "rejected") disableAnalytics()
  }, [consent])

  useEffect(() => {
    if (consent !== "accepted") return
    if (pathname === "/jobs/list") captureEvent("jobs_list_viewed")
    if (pathname === "/jobs/create") captureEvent("job_create_started")
    if (pathname === "/candidaturas") captureEvent("application_started")
  }, [consent, pathname])

  if (!isAnalyticsConfigured() || consent === undefined) return null

  const choose = (value: Exclude<Consent, null>) => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, value)
    window.dispatchEvent(new Event(CONSENT_CHANGED))
    setEditing(false)
  }

  return consent === null || editing ? (
    <section aria-label="Preferências de analytics" className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
      <p className="font-semibold text-slate-950">Analytics do site</p>
      <p className="mt-2 text-sm text-slate-700">Podemos medir visitas às vagas e ações principais para melhorar o site? Não enviamos seus dados de formulário ao PostHog.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("accepted")} className="rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Aceitar analytics</button>
        <button type="button" onClick={() => choose("rejected")} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900">Recusar</button>
      </div>
    </section>
  ) : (
    <button type="button" onClick={() => setEditing(true)} className="fixed bottom-3 left-3 z-[100] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-md">
      Preferências de analytics
    </button>
  )
}
