import { NextResponse } from 'next/server';

type NextResponseInit = ConstructorParameters<typeof NextResponse>[1];

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}

export function corsOptionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}

export function corsResponse(body: BodyInit | null, init?: NextResponseInit) {
  return new NextResponse(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers ?? {}),
    },
  })
}
