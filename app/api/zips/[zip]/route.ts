import { NextResponse } from "next/server"

import { ZIPS_API_URL } from "@/config"

type ZipRouteContext = {
  params: Promise<{ zip: string }>
}

export async function GET(_request: Request, { params }: ZipRouteContext) {
  const { zip } = await params
  const sanitizedZip = zip?.replace(/\D/g, "")

  if (!sanitizedZip || sanitizedZip.length !== 8) {
    return NextResponse.json(
      { message: "CEP inválido. Informe os 8 dígitos do CEP." },
      {
        status: 400,
      },
    )
  }

  try {
    const upstreamResponse = await fetch(`${ZIPS_API_URL}/${sanitizedZip}`, {
      cache: "no-store",
    })

    const responseBody = await upstreamResponse.text()

    return new NextResponse(responseBody, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": upstreamResponse.headers.get("Content-Type") ?? "application/json",
      },
    })
  } catch (error) {
    console.error("Erro ao consultar CEP no proxy:", error)
    return NextResponse.json(
      { message: "Não foi possível consultar o CEP no momento." },
      {
        status: 500,
      },
    )
  }
}
