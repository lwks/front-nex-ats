import { NextResponse } from "next/server"

import { JOBS_API_CREATE_URL, JOBS_API_URL } from "@/config"

import { CORS_HEADERS, corsOptionsResponse } from "../cors"

export const dynamic = "force-dynamic"

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = url.searchParams.get("limit")
    const lastKey = url.searchParams.get("lastKey")
    const upstreamUrl = new URL(JOBS_API_URL)

    if (limit) {
      upstreamUrl.searchParams.set("limit", limit)
    }

    if (lastKey) {
      upstreamUrl.searchParams.set("lastKey", lastKey)
    }

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
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
    console.error("Erro ao listar vagas no proxy:", error)
    return NextResponse.json(
      { message: "Não foi possível carregar as vagas no momento." },
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

    const upstreamResponse = await fetch(JOBS_API_CREATE_URL, {
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
    console.error("Erro ao criar vaga no proxy:", error)
    return NextResponse.json(
      { message: "Não foi possível criar a vaga no momento." },
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    )
  }
}
