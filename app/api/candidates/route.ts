import { NextResponse } from "next/server"

import { CANDIDATES_API_CREATE_URL } from "@/config"

import { CORS_HEADERS, corsOptionsResponse } from "../cors"
import { accountTypeError } from '@/lib/auth/require-api-account-type'

export const dynamic = "force-dynamic"

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function POST(request: Request) {
  const denied = await accountTypeError('CANDIDATE')
  if (denied) return denied
  try {
    const payload = await request.json()

    const upstreamResponse = await fetch(CANDIDATES_API_CREATE_URL, {
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
    console.error("Erro ao criar candidato no proxy:", error)
    return NextResponse.json(
      { message: "Não foi possível enviar os dados do candidato no momento." },
      {
        status: 500,
        headers: CORS_HEADERS,
      },
    )
  }
}
