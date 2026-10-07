import { NextResponse } from 'next/server'

export function POST() {
  return NextResponse.json({ message: 'Use a sessão Supabase para atualizar o token.' }, { status: 410 })
}
