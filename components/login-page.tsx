'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { createSupabaseBrowserClient } from '@/lib/auth/supabase-browser'
import {
  accountTypeFromClaims,
  destinationForAccountType,
  pendingAccountTypeFromClaims,
  type AccountType,
} from '@/lib/auth/supabase'

type Screen = 'login' | 'register' | 'complete' | 'recover'

export function LoginPage() {
  const params = useSearchParams()
  const [screen, setScreen] = useState<Screen>(params.get('mode') === 'recover' ? 'recover' : params.get('mode') === 'complete' ? 'complete' : 'login')
  const [type, setType] = useState<AccountType | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState(params.get('error') ? 'Não foi possível concluir a autenticação. Tente novamente.' : '')
  const [error, setError] = useState(Boolean(params.get('error')))
  const [busy, setBusy] = useState(false)
  const autoFinalized = useRef(false)
  const client = useMemo(() => createSupabaseBrowserClient(), [])

  const notice = useCallback((value: string, isError = false) => { setMessage(value); setError(isError) }, [])
  function changeScreen(next: Screen) { setScreen(next); setMessage(''); setType(null) }

  const finalizeAccount = useCallback(async (accountType?: AccountType | null) => {
    if (!client) return notice('Supabase não configurado.', true)
    try {
      const response = await fetch('/api/auth/account-type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType }),
      })
      const result = await response.json() as { accountType?: AccountType; destination?: string; message?: string }
      if (!response.ok || !result.accountType) return notice(result.message ?? 'Não foi possível concluir o cadastro.', true)
      const refreshed = await client.auth.refreshSession()
      if (refreshed.error) return notice('Não foi possível atualizar a sessão. Entre novamente.', true)
      sessionStorage.removeItem('cluster_pending_account_type')
      window.location.assign(result.destination ?? destinationForAccountType(result.accountType))
    } catch {
      notice('Não foi possível concluir o cadastro. Tente novamente.', true)
    }
  }, [client, notice])

  useEffect(() => {
    if (params.get('mode') !== 'complete' || !client || autoFinalized.current) return
    const pending = sessionStorage.getItem('cluster_pending_account_type')
    if (pending === 'CANDIDATE' || pending === 'COMPANY') {
      const timer = window.setTimeout(() => { autoFinalized.current = true; void finalizeAccount(pending) }, 0)
      return () => window.clearTimeout(timer)
    }
    // The callback may also be a first OAuth login without a chosen account type.
  }, [client, params, finalizeAccount])

  async function finishSignIn() {
    if (!client) return notice('Supabase não configurado.', true)
    const { data, error: claimsError } = await client.auth.getClaims()
    if (claimsError || !data?.claims) return notice('Não foi possível validar a sessão.', true)
    const current = accountTypeFromClaims(data.claims)
    if (current) {
      window.location.assign(destinationForAccountType(current))
      return
    }
    const pending = pendingAccountTypeFromClaims(data.claims)
    if (pending) await finalizeAccount(pending)
    else changeScreen('complete')
  }

  async function login(event: FormEvent) {
    event.preventDefault()
    if (!email || !password) return notice('Preencha e-mail e senha.', true)
    if (!client) return notice('Supabase não configurado.', true)
    setBusy(true)
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) notice(signInError.message, true)
    else await finishSignIn()
    setBusy(false)
  }

  async function register(event: FormEvent) {
    event.preventDefault()
    if (!type) return notice('Selecione Candidato ou Empresa.', true)
    if (!name || !email || !password || !confirm) return notice('Preencha todos os campos.', true)
    if (password !== confirm) return notice('As senhas não são iguais.', true)
    if (!client) return notice('Supabase não configurado.', true)
    setBusy(true)
    const { data, error: signUpError } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: name, account_type: type }, emailRedirectTo: `${window.location.origin}/auth/confirm` },
    })
    if (signUpError) notice(signUpError.message, true)
    else if (!data.session) notice('Cadastro realizado! Confirme seu e-mail antes de entrar.')
    else await finalizeAccount(type)
    setBusy(false)
  }

  async function oauth(provider: 'github' | 'linkedin_oidc', registration = false) {
    if (!client) return notice('Supabase não configurado.', true)
    if (registration && !type) return notice('Selecione Candidato ou Empresa.', true)
    if (registration && type) sessionStorage.setItem('cluster_pending_account_type', type)
    else sessionStorage.removeItem('cluster_pending_account_type')
    setBusy(true)
    const { error: oauthError } = await client.auth.signInWithOAuth({
      provider, options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (oauthError) {
      sessionStorage.removeItem('cluster_pending_account_type')
      notice(oauthError.message, true)
    }
    setBusy(false)
  }

  async function sendRecovery() {
    if (!email) return notice('Digite seu e-mail primeiro.', true)
    if (!client) return notice('Supabase não configurado.', true)
    setBusy(true)
    const { error: recoveryError } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm`,
    })
    notice(recoveryError?.message ?? 'Enviamos as instruções de recuperação para seu e-mail.', Boolean(recoveryError))
    setBusy(false)
  }

  async function updatePassword(event: FormEvent) {
    event.preventDefault()
    if (!password || password !== confirm) return notice('Confira a nova senha e a confirmação.', true)
    if (!client) return notice('Supabase não configurado.', true)
    setBusy(true)
    const { error: updateError } = await client.auth.updateUser({ password })
    if (updateError) notice(updateError.message, true)
    else { notice('Senha alterada com sucesso.'); setPassword(''); setConfirm(''); setScreen('login') }
    setBusy(false)
  }

  const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-3 text-[15px] outline-none focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20'
  const primaryClass = 'mt-5 w-full rounded-lg bg-[#FF6B00] px-4 py-3 font-semibold text-white hover:bg-[#E55F00] disabled:opacity-50'
  const socialClass = 'w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50'

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
    <section className="w-full max-w-[420px] rounded-2xl bg-white p-7 shadow-[0_8px_30px_rgba(0,0,0,.08)] sm:p-10">
      {screen === 'login' && <>
        <h1 className="text-center text-3xl font-bold">Cluster</h1>
        <p className="mb-7 mt-1 text-center text-slate-600">Entre na sua conta</p>
        <form onSubmit={login}>
          <label htmlFor="login-email" className="mb-1 block text-sm font-semibold">E-mail</label>
          <input id="login-email" type="email" autoComplete="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" />
          <label htmlFor="login-password" className="mb-1 mt-4 block text-sm font-semibold">Senha</label>
          <input id="login-password" type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" />
          <button className={primaryClass} disabled={busy}>Entrar</button>
        </form>
        <button type="button" className="mt-4 w-full text-sm text-[#C44E00] hover:text-[#E55F00]" onClick={sendRecovery} disabled={busy}>Esqueci minha senha</button>
        <Divider />
        <button type="button" className={`${socialClass} mb-2 bg-[#24292f]`} onClick={() => oauth('github')} disabled={busy}>Continuar com GitHub</button>
        <button type="button" className={`${socialClass} bg-[#0a66c2]`} onClick={() => oauth('linkedin_oidc')} disabled={busy}>Continuar com LinkedIn</button>
        <p className="mt-4 text-center text-sm">Não possui uma conta? <button className="text-[#C44E00] hover:text-[#E55F00]" onClick={() => changeScreen('register')}>Cadastre-se</button></p>
      </>}
      {(screen === 'register' || screen === 'complete') && <>
        <h1 className="text-center text-3xl font-bold">Criar conta</h1>
        <p className="mb-5 mt-1 text-center text-slate-600">Primeiro, escolha o tipo da sua conta</p>
        <div className="grid grid-cols-2 gap-2.5">
          {([['CANDIDATE', 'Candidato', 'Quero buscar vagas'], ['COMPANY', 'Empresa', 'Quero gerenciar vagas']] as const).map(([value, label, description]) =>
            <button key={value} type="button" aria-pressed={type === value} disabled={busy} onClick={() => { setType(value); if (screen === 'complete') { setBusy(true); void finalizeAccount(value).finally(() => setBusy(false)) } }} className={`rounded-xl border-2 p-3 text-center hover:border-[#FF6B00] ${type === value ? 'border-[#FF6B00] bg-[#FFF1E8] text-[#C44E00]' : 'border-slate-200'}`}>
              <strong className="block">{label}</strong><small>{description}</small>
            </button>)}
        </div>
        {screen === 'register' && type && <>
          <form onSubmit={register} className="mt-5">
            <label htmlFor="register-name" className="mb-1 block text-sm font-semibold">Nome</label>
            <input id="register-name" className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Seu nome" />
            <label htmlFor="register-email" className="mb-1 mt-4 block text-sm font-semibold">E-mail</label>
            <input id="register-email" type="email" className={inputClass} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" />
            <label htmlFor="register-password" className="mb-1 mt-4 block text-sm font-semibold">Senha</label>
            <input id="register-password" type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Crie uma senha" />
            <label htmlFor="register-confirm" className="mb-1 mt-4 block text-sm font-semibold">Confirmar senha</label>
            <input id="register-confirm" type="password" className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repita a senha" />
            <button className={primaryClass} disabled={busy}>Criar conta com e-mail</button>
          </form>
          <Divider />
          <button type="button" className={`${socialClass} mb-2 bg-[#24292f]`} onClick={() => oauth('github', true)} disabled={busy}>Cadastrar com GitHub</button>
          <button type="button" className={`${socialClass} bg-[#0a66c2]`} onClick={() => oauth('linkedin_oidc', true)} disabled={busy}>Cadastrar com LinkedIn</button>
          <button type="button" className="mt-3 w-full text-sm text-[#C44E00] hover:text-[#E55F00]" onClick={() => setType(null)}>Alterar tipo da conta</button>
        </>}
        {screen === 'complete' && <p className="mt-4 text-center text-sm text-slate-600">Login autenticado. Escolha seu tipo para concluir o cadastro.</p>}
        <p className="mt-4 text-center text-sm">Já possui uma conta? <button className="text-[#C44E00] hover:text-[#E55F00]" onClick={() => changeScreen('login')}>Entrar</button></p>
      </>}
      {screen === 'recover' && <>
        <h1 className="text-center text-2xl font-bold">Criar nova senha</h1>
        <form onSubmit={updatePassword} className="mt-6">
          <label htmlFor="new-password" className="mb-1 block text-sm font-semibold">Nova senha</label>
          <input id="new-password" type="password" className={inputClass} value={password} onChange={(event) => setPassword(event.target.value)} />
          <label htmlFor="confirm-new-password" className="mb-1 mt-4 block text-sm font-semibold">Confirmar nova senha</label>
          <input id="confirm-new-password" type="password" className={inputClass} value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          <button className={primaryClass} disabled={busy}>Salvar nova senha</button>
        </form>
      </>}
      {message && <p role="status" className={`mt-4 rounded-md p-3 text-sm ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{message}</p>}
    </section>
  </main>
}

function Divider() {
  return <div className="my-6 flex items-center gap-3 text-sm text-slate-500 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">ou</div>
}
