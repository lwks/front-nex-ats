'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  buildLogoutUrl,
  clearTokens,
  extractAuthProfile,
  getCognitoConfig,
  hasValidSession,
  loadTokens,
  persistTokens,
  createAuthorizeRequest,
  type CognitoTokens,
} from '@/lib/auth/cognito'

type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  availableProfiles: string[]
  email?: string
  username?: string
  accessToken?: string
  saveSession: (tokens: CognitoTokens) => void
  login: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [tokens, setTokens] = useState<CognitoTokens | null>(null)

  useEffect(() => {
    const storedTokens = loadTokens()

    if (hasValidSession(storedTokens)) {
      setTokens(storedTokens)
    } else {
      clearTokens()
    }

    setIsLoading(false)
  }, [])

  const saveSession = useCallback((nextTokens: CognitoTokens) => {
    persistTokens(nextTokens)
    setTokens(nextTokens)
  }, [])

  const login = useCallback(async () => {
    const config = getCognitoConfig()
    const url = await createAuthorizeRequest(config)
    window.location.assign(url)
  }, [])

  const logout = useCallback(() => {
    const config = getCognitoConfig()
    const logoutUrl = buildLogoutUrl(config)
    clearTokens()
    setTokens(null)

    if (logoutUrl) {
      window.location.assign(logoutUrl)
      return
    }

    window.location.assign('/')
  }, [])

  const profile = extractAuthProfile(tokens?.idToken)

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: hasValidSession(tokens),
      isLoading,
      availableProfiles: profile.availableProfiles,
      email: profile.email,
      username: profile.username,
      accessToken: tokens?.accessToken,
      saveSession,
      login,
      logout,
    }),
    [isLoading, login, logout, profile.availableProfiles, profile.email, profile.username, saveSession, tokens],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro do AuthProvider.')
  }

  return context
}
