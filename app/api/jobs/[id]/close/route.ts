import { NextResponse } from "next/server"
import { JOBS_API_URL } from "@/config"
import { authorizeApiAccountType } from "@/lib/auth/require-api-account-type"
import { CORS_HEADERS, corsOptionsResponse } from "../../../cors"

export async function OPTIONS() { return corsOptionsResponse() }

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApiAccountType("COMPANY")
  if (!authorization.ok) return authorization.response
  try {
    const { id } = await context.params
    const response = await fetch(`${JOBS_API_URL}/${encodeURIComponent(id)}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${authorization.accessToken}` },
      body: JSON.stringify(await request.json()),
    })
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { ...CORS_HEADERS, "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    })
  } catch {
    return NextResponse.json({ message: "Não foi possível encerrar a vaga." }, { status: 500, headers: CORS_HEADERS })
  }
}
