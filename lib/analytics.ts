import posthog from "posthog-js"

export const ANALYTICS_CONSENT_KEY = "clusterhr-analytics-consent"

export type AnalyticsEvent =
  | "jobs_list_viewed"
  | "job_details_opened"
  | "apply_clicked"
  | "application_started"
  | "application_step_completed"
  | "application_submitted"
  | "application_failed"
  | "job_create_started"
  | "job_created"
  | "job_create_failed"
  | "candidate_status_changed"
  | "login_completed"
  | "signup_completed"

type AnalyticsProperties = {
  job_id?: string
  step?: number
  source?: "list" | "modal" | "detail"
  mode?: "saved_profile" | "updated_profile"
  reason?: "validation" | "request"
  status?: string
  account_type?: "CANDIDATE" | "COMPANY"
}

let initialized = false
let enabled = false

export function isAnalyticsConfigured() {
  return process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true" &&
    Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST)
}

export function enableAnalytics() {
  if (!isAnalyticsConfigured()) return false
  if (!initialized) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST!,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      capture_performance: false,
      persistence: "localStorage",
      before_send: (event) => {
        for (const key of ["$current_url", "$initial_current_url", "$referrer", "$initial_referrer"]) {
          const value = event?.properties?.[key]
          if (typeof value !== "string") continue
          try {
            const url = new URL(value)
            event.properties[key] = `${url.origin}${url.pathname}`
          } catch {
            delete event.properties[key]
          }
        }
        return event
      },
    })
    initialized = true
  }
  posthog.opt_in_capturing()
  enabled = true
  return true
}

export function disableAnalytics() {
  enabled = false
  if (initialized) {
    posthog.opt_out_capturing()
    posthog.reset()
  }
}

export function captureEvent(event: AnalyticsEvent, properties: AnalyticsProperties = {}) {
  if (!enabled && typeof window !== "undefined" && window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "accepted") {
    enableAnalytics()
  }
  if (!enabled) return
  posthog.capture(event, properties)
}
