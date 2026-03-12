'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { exchangeCodeForTokens, getCognitoConfig } from '@/lib/auth/cognito'

export default function AuthCallbackPage() {
  const { saveSession } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function completeLogin() {
      try {
        const tokens = await exchangeCodeForTokens(getCognitoConfig(), window.location.search)
        saveSession(tokens)
        window.location.replace('/')
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : 'Não foi possível concluir o login.'
        setError(message)
      }
    }

    void completeLogin()
  }, [saveSession])

  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold text-foreground">Processando autenticação</h1>
      {!error && <p className="mt-4 text-muted-foreground">Aguarde, finalizando login...</p>}
      {error && (
        <>
          <p className="mt-4 text-red-600">{error}</p>
          <Link className="mt-6 inline-block underline" href="/login">
            Voltar para login
          </Link>
        </>
      )}
    </main>
  )
}
