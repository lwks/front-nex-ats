import { beforeEach, describe, expect, it, vi } from "vitest"

const sdk = vi.hoisted(() => ({
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
  capture: vi.fn(),
}))

vi.mock("posthog-js", () => ({ default: sdk }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_ENABLED", "true")
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test")
  vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "https://us.i.posthog.com")
})

describe("analytics", () => {
  it("does not initialize or capture without configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "")
    const analytics = await import("@/lib/analytics")
    expect(analytics.enableAnalytics()).toBe(false)
    analytics.captureEvent("apply_clicked", { job_id: "job-1" })
    expect(sdk.init).not.toHaveBeenCalled()
    expect(sdk.capture).not.toHaveBeenCalled()
  })

  it("captures named events after enabling and stops after revocation", async () => {
    const analytics = await import("@/lib/analytics")
    analytics.captureEvent("apply_clicked", { job_id: "job-1" })
    expect(sdk.capture).not.toHaveBeenCalled()

    expect(analytics.enableAnalytics()).toBe(true)
    expect(sdk.init).toHaveBeenCalledOnce()
    expect(sdk.init).toHaveBeenCalledWith("phc_test", expect.objectContaining({
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
    }))
    const [, config] = sdk.init.mock.calls[0] as unknown as [string, {
      before_send: (event: { properties: Record<string, string> }) => { properties: Record<string, string> }
    }]
    const payload = config.before_send({ properties: {
      $current_url: "https://clusterjobs.com.br/candidaturas?vagaGuid=123&token=secret",
      $referrer: "https://example.com/search?q=private",
    } })
    expect(payload.properties.$current_url).toBe("https://clusterjobs.com.br/candidaturas")
    expect(payload.properties.$referrer).toBe("https://example.com/search")
    analytics.captureEvent("application_submitted", { job_id: "job-1", mode: "saved_profile" })
    expect(sdk.capture).toHaveBeenCalledWith("application_submitted", { job_id: "job-1", mode: "saved_profile" })

    analytics.disableAnalytics()
    analytics.captureEvent("job_created", { job_id: "job-2" })
    expect(sdk.opt_out_capturing).toHaveBeenCalledOnce()
    expect(sdk.capture).toHaveBeenCalledTimes(1)
  })
})
