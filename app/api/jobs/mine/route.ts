import { NextResponse } from "next/server"
import { JOBS_API_URL } from "@/config"
import { authorizeApiAccountType } from "@/lib/auth/require-api-account-type"
import { CORS_HEADERS, corsOptionsResponse } from "../../cors"

export const dynamic = "force-dynamic"

export async function OPTIONS() { return corsOptionsResponse() }

export async function GET() {
  const authorization = await authorizeApiAccountType("COMPANY")
  if (!authorization.ok) return authorization.response
  try {
    const response = await fetch(`${JOBS_API_URL}/mine`, {
      headers: { Authorization: `Bearer ${authorization.accessToken}` },
      cache: "no-store",
    })
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { ...CORS_HEADERS, "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    })
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar suas vagas." }, { status: 500, headers: CORS_HEADERS })
  }
}
