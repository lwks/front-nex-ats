"use client"

import Link from "next/link"
import { FormEvent, useMemo, useState } from "react"
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  CircleAlert,
  ShieldCheck,
  UserPlus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createFakeUserAccount,
  type CreateFakeUserInput,
  type FakeUserAccount,
  type UserRegistrationRole,
} from "@/services/user-registration-service"

type RegistrationFormState = CreateFakeUserInput & {
  shouldSimulateFailure: boolean
}

type SubmissionFeedback =
  | {
      type: "success"
      title: string
      message: string
      account: FakeUserAccount
    }
  | {
      type: "error"
      title: string
      message: string
    }

const ROLE_OPTIONS: Array<{ value: UserRegistrationRole; label: string; description: string }> = [
  { value: "candidate", label: "Candidato", description: "Acesso para acompanhar candidaturas e perfil." },
  { value: "recruiter", label: "Recrutador", description: "Acesso para publicar vagas e avaliar pipeline." },
  { value: "manager", label: "Gestor", description: "Acesso para acompanhar resultados e aprovacoes." },
]

function createDefaultFormState(): RegistrationFormState {
  return {
    fullName: "",
    email: "",
    password: "",
    role: "candidate",
    wantsJobAlerts: true,
    acceptTerms: false,
    shouldSimulateFailure: false,
  }
}

function formatRoleLabel(role: UserRegistrationRole) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
}

export function UserRegistrationPage() {
  const [formState, setFormState] = useState<RegistrationFormState>(createDefaultFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmissionFeedback | null>(null)

  const selectedRole = useMemo(
    () => ROLE_OPTIONS.find((option) => option.value === formState.role) ?? ROLE_OPTIONS[0],
    [formState.role],
  )

  const updateField = <Key extends keyof RegistrationFormState>(key: Key, value: RegistrationFormState[Key]) => {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  const resetForm = () => {
    setFormState(createDefaultFormState())
    setFeedback(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const account = await createFakeUserAccount(formState, {
        shouldFail: formState.shouldSimulateFailure,
      })

      setFeedback({
        type: "success",
        title: "Usuario fake criado com sucesso",
        message: "A conta foi gerada localmente para validar o fluxo antes da integracao real.",
        account,
      })
      setFormState((current) => ({
        ...current,
        password: "",
        acceptTerms: false,
        shouldSimulateFailure: false,
      }))
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel concluir a criacao do usuario."

      setFeedback({
        type: "error",
        title: "Falha ao criar usuario",
        message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fff8f1_0%,_#ffffff_26%,_#f8fafc_100%)] text-slate-950">
      <header className="border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/jobs/list" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-[#FF6B00]">
            <ArrowLeft className="size-4" />
            Voltar para vagas
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B00]/15 bg-[#FF6B00]/8 px-4 py-2 text-sm font-medium text-[#C44E00]">
            <UserPlus className="size-4" />
            Criacao de usuario
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.85fr)] lg:items-start">
        <section className="rounded-[2rem] border border-black/5 bg-slate-950 p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-orange-200">
            <Briefcase className="size-4" />
            Fluxo de acesso ClusterHR
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">Crie um usuario para testar o onboarding de acesso.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Esta pagina simula o cadastro sem backend real. O objetivo e validar a experiencia, os campos e a resposta visual do fluxo.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="size-5 text-orange-300" />
              <p className="mt-4 text-sm font-semibold">Validacao local</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Nome, email, senha, perfil e aceite de termos.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <BadgeCheck className="size-5 text-orange-300" />
              <p className="mt-4 text-sm font-semibold">Conta fake</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Gera ID local e confirma o payload final sem chamar API externa.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <CircleAlert className="size-5 text-orange-300" />
              <p className="mt-4 text-sm font-semibold">Teste de erro</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">O toggle de falha permite revisar o estado de erro do fluxo.</p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-200">Perfil selecionado</p>
            <h2 className="mt-3 text-2xl font-semibold">{selectedRole.label}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selectedRole.description}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Novo usuario</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Cadastro de acesso</h2>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              Limpar
            </button>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={formState.fullName}
                onChange={(event) => updateField("fullName", event.currentTarget.value)}
                placeholder="Ex.: Mariana Costa"
                autoComplete="name"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => updateField("email", event.currentTarget.value)}
                  placeholder="mariana@clusterhr.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha inicial</Label>
                <Input
                  id="password"
                  type="password"
                  value={formState.password}
                  onChange={(event) => updateField("password", event.currentTarget.value)}
                  placeholder="Minimo de 8 caracteres"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-950">Perfil de acesso</legend>
              <div className="grid gap-3">
                {ROLE_OPTIONS.map((option) => {
                  const isSelected = option.value === formState.role

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                        isSelected
                          ? "border-[#FF6B00] bg-[#FFF5ED] shadow-[0_10px_30px_rgba(255,107,0,0.08)]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={isSelected}
                        onChange={() => updateField("role", option.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold text-slate-950">{option.label}</span>
                        <span className="mt-1 block text-sm leading-6 text-slate-600">{option.description}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="wantsJobAlerts"
                  checked={formState.wantsJobAlerts}
                  onCheckedChange={(checked) => updateField("wantsJobAlerts", checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="wantsJobAlerts">Receber comunicacoes e alertas de vagas</Label>
                  <p className="text-sm leading-6 text-slate-500">Mantem o usuario fake inscrito nas notificacoes de oportunidade.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="acceptTerms"
                  checked={formState.acceptTerms}
                  onCheckedChange={(checked) => updateField("acceptTerms", checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="acceptTerms">Aceito os termos de uso e privacidade</Label>
                  <p className="text-sm leading-6 text-slate-500">Obrigatorio para a simulacao respeitar a regra do fluxo.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="shouldSimulateFailure"
                  checked={formState.shouldSimulateFailure}
                  onCheckedChange={(checked) => updateField("shouldSimulateFailure", checked === true)}
                />
                <div className="space-y-1">
                  <Label htmlFor="shouldSimulateFailure">Simular erro de criacao</Label>
                  <p className="text-sm leading-6 text-slate-500">Liga um retorno de erro controlado para validar o estado de falha.</p>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]" disabled={isSubmitting}>
              {isSubmitting ? "Criando usuario..." : "Criar usuario fake"}
            </Button>
          </form>

          {feedback ? (
            <div
              className={`mt-6 rounded-[1.5rem] border px-5 py-4 ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-start gap-3">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
                ) : (
                  <CircleAlert className="mt-0.5 size-5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{feedback.title}</p>
                  <p className="mt-1 text-sm leading-6">{feedback.message}</p>
                  {feedback.type === "success" ? (
                    <dl className="mt-4 grid gap-3 rounded-2xl bg-white/80 p-4 text-sm text-slate-700 sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold text-slate-950">ID fake</dt>
                        <dd className="mt-1 break-all">{feedback.account.id}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-950">Perfil</dt>
                        <dd className="mt-1">{formatRoleLabel(feedback.account.role)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-950">Email salvo</dt>
                        <dd className="mt-1">{feedback.account.email}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-950">Status</dt>
                        <dd className="mt-1">Ativo</dd>
                      </div>
                    </dl>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
    </div>
  )
}
