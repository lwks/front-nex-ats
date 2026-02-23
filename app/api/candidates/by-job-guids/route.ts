import { NextResponse } from "next/server"

import { CANDIDATES_BY_JOB_GUIDS_API_URL } from "@/config"

import { CORS_HEADERS, corsOptionsResponse } from "../../cors"

export const dynamic = "force-dynamic"

export async function OPTIONS() {
  return corsOptionsResponse()
}


export async function GET() {
  try {
    const upstreamResponse = await fetch(CANDIDATES_BY_JOB_GUIDS_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
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
    console.error("Erro ao buscar vagas por guid no proxy:", error)
    return NextResponse.json(
      { message: "Não foi possível buscar as vagas de candidaturas no momento." },
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    )
  }
}
