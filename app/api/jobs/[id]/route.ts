import { NextResponse } from "next/server"
import { JOBS_API_URL } from "@/config"
import { CORS_HEADERS, corsOptionsResponse } from "../../cors"

export async function OPTIONS() { return corsOptionsResponse() }

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const response = await fetch(`${JOBS_API_URL}/${encodeURIComponent(id)}`, { cache: "no-store" })
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { ...CORS_HEADERS, "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    })
  } catch {
    return NextResponse.json({ message: "Não foi possível consultar a vaga." }, { status: 500, headers: CORS_HEADERS })
  }
}
