import { NextResponse } from "next/server"

import { CANDIDATES_BY_JOB_GUIDS_API_CREATE_URL } from "@/config"

import { CORS_HEADERS, corsOptionsResponse } from "../../cors"

export const dynamic = "force-dynamic"

export async function OPTIONS() {
  return corsOptionsResponse()
}


export async function GET() {
  try {
    const upstreamResponse = await fetch(CANDIDATES_BY_JOB_GUIDS_API_CREATE_URL, {
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

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const upstreamResponse = await fetch(CANDIDATES_BY_JOB_GUIDS_API_CREATE_URL, {
      method: "POST",
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
    console.error("Erro ao criar candidato por guid de vaga no proxy:", error)
    return NextResponse.json(
      { message: "Não foi possível enviar os dados da candidatura no momento." },
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    )
  }
}
