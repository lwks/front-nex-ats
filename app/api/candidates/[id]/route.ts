import { NextResponse } from "next/server"

import { CANDIDATES_API_URL } from "@/config"

import { CORS_HEADERS, corsOptionsResponse } from "../../cors"

export const dynamic = "force-dynamic"

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const payload = await request.json()

    const upstreamResponse = await fetch(`${CANDIDATES_API_URL}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const responseBody = await upstreamResponse.text()

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": upstreamResponse.headers.get("Content-Type") ?? "application/json",
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar candidato no proxy:", error)
    return NextResponse.json(
      { message: "Nao foi possivel atualizar o candidato no momento." },
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    )
  }
}
