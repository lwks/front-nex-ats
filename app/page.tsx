import { JobListings } from "@/components/job-listings"
import { cookies } from "next/headers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  ACCESS_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  TOKEN_EXPIRES_AT_COOKIE,
  getSessionState,
  isAuthEnabled,
} from "@/lib/auth/cognito"

export default async function HomePage() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const authEnabled = isAuthEnabled(headerStore.get("x-forwarded-host") ?? headerStore.get("host"))
  const session = getSessionState({
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    idToken: cookieStore.get(ID_TOKEN_COOKIE)?.value ?? null,
    expiresAt: cookieStore.get(TOKEN_EXPIRES_AT_COOKIE)?.value ?? null,
  })

  if (authEnabled && !session.authenticated) {
    redirect("/api/auth/login")
  }

  return <JobListings />
}
