'use client'

import { useMemo } from 'react'
import { useAuth } from '@/components/providers/auth-provider'

export default function LoginPage() {
  const { isAuthenticated, isLoading, login, availableProfiles, email, username } = useAuth()

  const content = useMemo(() => {
    if (isLoading) {
      return 'Validando sessão...'
    }

    if (isAuthenticated) {
      return 'Você já está autenticado via AWS Cognito.'
    }

    return 'Use o botão abaixo para autenticar no AWS Cognito.'
  }, [isAuthenticated, isLoading])

  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold text-foreground">Login</h1>
      <p className="mt-4 text-muted-foreground">{content}</p>

      {!isAuthenticated && (
        <button
          type="button"
          onClick={() => {
            void login()
          }}
          disabled={isLoading}
          className="mt-8 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Entrar com AWS Cognito
        </button>
      )}

      {isAuthenticated && (
        <div className="mt-8 rounded-md border border-border p-4">
          <p className="text-sm text-foreground">Usuário: {username ?? email ?? 'não identificado'}</p>
          <p className="mt-2 text-sm text-foreground">
            Perfis disponíveis: {availableProfiles.length > 0 ? availableProfiles.join(', ') : 'não informado'}
          </p>
        </div>
      )}
    </main>
  )
}
