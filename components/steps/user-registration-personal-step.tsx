"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZIPS_API_PROXY_URL } from "@/config"
import { defaultCurrentBenefitOptions, defaultSeniorityOptions, type OnboardingOption } from "@/lib/onboarding-options"
import {
  formatZipSummary,
  hasZipCityAndState,
  isRecord,
  normalizeZipResponse,
  pickFirstStringValue,
  type ZipLookupResponse,
} from "@/lib/zip-utils"
import { cn } from "@/lib/utils"
import { fetchCurrentBenefitOptions, fetchSeniorityOptions } from "@/services/onboarding-options-service"
import type { UserRegistrationData } from "@/services/user-registration-service"

type UserRegistrationPersonalStepProps = {
  data: Partial<UserRegistrationData>
  onNext: () => void
  onUpdate: (data: Partial<UserRegistrationData>) => void
}

const CPF_LENGTH = 11
const RG_MIN_LENGTH = 7
const RG_MAX_LENGTH = 10
const CEP_LENGTH = 8
const CEL_MIN_LENGTH = 10
const CEL_MAX_LENGTH = 11

const hasFullName = (value: string) => value.trim().split(/\s+/).length >= 2
const hasNonEmptyValue = (value: string) => value.trim().length > 0

const calcCpfDigit = (base: string, factor: number) => {
  let total = 0
  for (const char of base) {
    total += Number(char) * factor--
  }
  const remainder = total % 11
  return remainder < 2 ? 0 : 11 - remainder
}

const validateCpf = (value: string) => {
  if (value.length !== CPF_LENGTH) return false
  if (/^(\d)\1{10}$/.test(value)) return false

  const firstNine = value.slice(0, 9)
  const firstDigit = calcCpfDigit(firstNine, 10)
  const secondDigit = calcCpfDigit(firstNine + firstDigit, 11)

  return value === `${firstNine}${firstDigit}${secondDigit}`
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isValidPhone = (value: string) => value.length >= CEL_MIN_LENGTH && value.length <= CEL_MAX_LENGTH

function isValidBirthDate(value: string) {
  if (!value) {
    return false
  }

  const parsedDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) {
    return false
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return parsedDate <= today
}

const getDocumentError = (value: string) => {
  if (!value) {
    return "Informe seu CPF ou RG."
  }

  if (value.length === CPF_LENGTH) {
    return validateCpf(value) ? "" : "Informe um CPF valido."
  }

  if (value.length >= RG_MIN_LENGTH && value.length <= RG_MAX_LENGTH) {
    return ""
  }

  return `Informe um CPF com ${CPF_LENGTH} digitos ou um RG entre ${RG_MIN_LENGTH} e ${RG_MAX_LENGTH} digitos.`
}

export function UserRegistrationPersonalStep({
  data,
  onNext,
  onUpdate,
}: UserRegistrationPersonalStepProps) {
  const [formData, setFormData] = useState({
    nome: data.nome || "",
    documento: (data.documento || "").replace(/\D/g, ""),
    dataNascimento: data.dataNascimento || "",
    localResidencia: (data.localResidencia || "").replace(/\D/g, ""),
    endereco: data.endereco || "",
    cidade: data.cidade || "",
    estado: data.estado || "",
    contatoCel: (data.contatoCel || "").replace(/\D/g, ""),
    contato: data.contato || "",
    empresaAtual: data.empresaAtual || "",
    cargoAtual: data.cargoAtual || "",
    senioridade: data.senioridade || "",
    beneficiosAtuais: data.beneficiosAtuais || [],
    lgpdAccepted: data.lgpdAccepted || false,
  })
  const [errors, setErrors] = useState({
    nome: "",
    documento: "",
    dataNascimento: "",
    localResidencia: "",
    endereco: "",
    cidade: "",
    estado: "",
    contatoCel: "",
    contato: "",
    empresaAtual: "",
    cargoAtual: "",
    senioridade: "",
    beneficiosAtuais: "",
  })
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false)
  const [zipLookupError, setZipLookupError] = useState<string | null>(null)
  const [zipLookupResult, setZipLookupResult] = useState<ZipLookupResponse | null>(null)
  const [hasAttemptedZipLookup, setHasAttemptedZipLookup] = useState(false)
  const [seniorityOptions, setSeniorityOptions] = useState<OnboardingOption[]>(defaultSeniorityOptions)
  const [benefitOptions, setBenefitOptions] = useState<OnboardingOption[]>(defaultCurrentBenefitOptions)
  const zipLookupController = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      zipLookupController.current?.abort()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [seniorities, benefits] = await Promise.all([
        fetchSeniorityOptions(),
        fetchCurrentBenefitOptions(),
      ])

      if (isMounted) {
        setSeniorityOptions(seniorities)
        setBenefitOptions(benefits)
      }
    }

    loadOptions().catch((error) => console.error("Failed to load personal data options", error))

    return () => {
      isMounted = false
    }
  }, [])

  const hasZipCityState = hasZipCityAndState(zipLookupResult)
  const isCepMissing = formData.localResidencia.trim().length === 0
  const isCepIncomplete =
    formData.localResidencia.length > 0 && formData.localResidencia.length < CEP_LENGTH
  const shouldValidateZip =
    isCepMissing || hasAttemptedZipLookup || formData.localResidencia.length === CEP_LENGTH
  const isZipValidationBlocked =
    shouldValidateZip &&
    (isCepMissing ||
      isCepIncomplete ||
      isZipLookupLoading ||
      Boolean(zipLookupError) ||
      !hasZipCityState)

  const isFormComplete =
    hasFullName(formData.nome) &&
    getDocumentError(formData.documento) === "" &&
    isValidBirthDate(formData.dataNascimento) &&
    !isZipValidationBlocked &&
    hasNonEmptyValue(formData.endereco) &&
    hasNonEmptyValue(formData.cidade) &&
    hasNonEmptyValue(formData.estado) &&
    isValidPhone(formData.contatoCel) &&
    isValidEmail(formData.contato) &&
    hasNonEmptyValue(formData.empresaAtual) &&
    hasNonEmptyValue(formData.cargoAtual) &&
    hasNonEmptyValue(formData.senioridade) &&
    formData.beneficiosAtuais.length > 0 &&
    formData.lgpdAccepted

  function getZipErrorMessage() {
    if (!isZipValidationBlocked) {
      return ""
    }

    if (isCepMissing) {
      return "Informe o CEP."
    }
    if (isCepIncomplete) {
      return `Informe os ${CEP_LENGTH} digitos do CEP.`
    }
    return zipLookupError ?? "Informe um CEP valido."
  }

  const validateFields = () => {
    const newErrors = {
      nome: "",
      documento: "",
      dataNascimento: "",
      localResidencia: "",
      endereco: "",
      cidade: "",
      estado: "",
      contatoCel: "",
      contato: "",
      empresaAtual: "",
      cargoAtual: "",
      senioridade: "",
      beneficiosAtuais: "",
    }

    newErrors.nome = hasFullName(formData.nome) ? "" : "Informe nome e sobrenome."
    newErrors.documento = getDocumentError(formData.documento)
    newErrors.dataNascimento = !formData.dataNascimento
      ? "Informe a data de nascimento."
      : isValidBirthDate(formData.dataNascimento)
        ? ""
        : "Informe uma data de nascimento valida."
    newErrors.localResidencia = getZipErrorMessage()
    newErrors.endereco = hasNonEmptyValue(formData.endereco) ? "" : "Informe o endereco."
    newErrors.cidade = hasNonEmptyValue(formData.cidade) ? "" : "Informe a cidade."
    newErrors.estado = hasNonEmptyValue(formData.estado) ? "" : "Informe o estado."
    newErrors.contatoCel = isValidPhone(formData.contatoCel)
      ? ""
      : `Informe um celular com ${CEL_MIN_LENGTH} a ${CEL_MAX_LENGTH} digitos.`
    newErrors.contato = isValidEmail(formData.contato) ? "" : "Digite um e-mail valido."
    newErrors.empresaAtual = hasNonEmptyValue(formData.empresaAtual) ? "" : "Informe a empresa atual."
    newErrors.cargoAtual = hasNonEmptyValue(formData.cargoAtual) ? "" : "Informe o cargo atual."
    newErrors.senioridade = hasNonEmptyValue(formData.senioridade) ? "" : "Selecione a senioridade atual."
    newErrors.beneficiosAtuais =
      formData.beneficiosAtuais.length > 0 ? "" : "Selecione ao menos um beneficio atual."

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === "")
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validateFields()) {
      return
    }
    if (!formData.lgpdAccepted) {
      alert("Por favor, aceite os termos de privacidade para continuar.")
      return
    }
    onUpdate(formData)
    onNext()
  }

  const lookupZip = useCallback(async (cep: string) => {
    if (zipLookupController.current) {
      zipLookupController.current.abort()
    }

    const controller = new AbortController()
    zipLookupController.current = controller

    setIsZipLookupLoading(true)
    setZipLookupError(null)
    setZipLookupResult(null)
    setFormData((previous) => ({ ...previous, endereco: "", cidade: "", estado: "" }))
    setHasAttemptedZipLookup(true)

    try {
      const response = await fetch(`${ZIPS_API_PROXY_URL}/${cep}`, {
        signal: controller.signal,
      })
      let responseData: unknown = null

      try {
        responseData = await response.json()
      } catch (error) {
        console.error("Erro ao ler o corpo da resposta do CEP:", error)
      }

      if (!response.ok) {
        let errorMessage = "Nao foi possivel consultar o CEP informado."

        if (isRecord(responseData)) {
          const possibleMessage = responseData.message
          if (typeof possibleMessage === "string" && possibleMessage.trim().length > 0) {
            errorMessage = possibleMessage.trim()
          }
        }

        throw new Error(errorMessage)
      }

      const parsedBody = isRecord(responseData) ? (responseData as ZipLookupResponse) : null
      const normalizedResult = normalizeZipResponse(parsedBody, cep)
      const normalizedSummary = formatZipSummary(normalizedResult)
      const normalizedCity = pickFirstStringValue(normalizedResult, ["localidade", "cidade", "city"]) ?? ""
      const normalizedState = pickFirstStringValue(normalizedResult, ["uf", "estado", "state"]) ?? ""

      setZipLookupResult(normalizedResult)
      setFormData((previous) => ({
        ...previous,
        endereco: normalizedSummary ?? "",
        cidade: normalizedCity,
        estado: normalizedState,
      }))
      setErrors((previous) => ({
        ...previous,
        localResidencia: "",
        endereco: "",
        cidade: "",
        estado: "",
      }))
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      console.error("Erro ao consultar CEP:", error)
      const normalizedMessage = error instanceof Error ? error.message.trim() : ""
      setZipLookupError(
        normalizedMessage.length > 0 ? normalizedMessage : "Nao foi possivel consultar o CEP informado.",
      )
      setZipLookupResult(null)
      setFormData((previous) => ({ ...previous, endereco: "", cidade: "", estado: "" }))
    } finally {
      if (zipLookupController.current === controller) {
        zipLookupController.current = null
        setIsZipLookupLoading(false)
      }
    }
  }, [])

  const handleZipChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "").slice(0, CEP_LENGTH)

    if (errors.localResidencia) {
      setErrors((previous) => ({ ...previous, localResidencia: "" }))
    }

    setFormData((previous) => ({
      ...previous,
      localResidencia: digitsOnly,
      endereco: digitsOnly.length < CEP_LENGTH ? "" : previous.endereco,
      cidade: digitsOnly.length < CEP_LENGTH ? "" : previous.cidade,
      estado: digitsOnly.length < CEP_LENGTH ? "" : previous.estado,
    }))

    setHasAttemptedZipLookup(digitsOnly.length === CEP_LENGTH)

    if (digitsOnly.length === CEP_LENGTH) {
      void lookupZip(digitsOnly)
    } else {
      if (zipLookupController.current) {
        zipLookupController.current.abort()
        zipLookupController.current = null
      }
      setZipLookupResult(null)
      setZipLookupError(null)
      setHasAttemptedZipLookup(false)
      setIsZipLookupLoading(false)
      setFormData((previous) => ({ ...previous, endereco: "", cidade: "", estado: "" }))
    }
  }

  useEffect(() => {
    if (
      formData.localResidencia.length === CEP_LENGTH &&
      !hasAttemptedZipLookup &&
      !isZipLookupLoading
    ) {
      void lookupZip(formData.localResidencia)
    }
  }, [formData.localResidencia, hasAttemptedZipLookup, isZipLookupLoading, lookupZip])

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:p-8">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#C44E00]">Cadastro oficial</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Dados pessoais</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Preencha seus dados pessoais, de contato e informacoes atuais de trabalho.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(event) => setFormData({ ...formData, nome: event.target.value })}
              className={cn(errors.nome && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.nome ? "true" : "false"}
            />
            {errors.nome ? <p className="text-xs text-destructive">{errors.nome}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data Nascimento</Label>
            <Input
              id="dataNascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(event) => setFormData({ ...formData, dataNascimento: event.target.value })}
              className={cn(errors.dataNascimento && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.dataNascimento ? "true" : "false"}
            />
            {errors.dataNascimento ? <p className="text-xs text-destructive">{errors.dataNascimento}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="documento">CPF ou RG</Label>
            <Input
              id="documento"
              inputMode="numeric"
              value={formData.documento}
              onChange={(event) =>
                setFormData({ ...formData, documento: event.target.value.replace(/\D/g, "").slice(0, CPF_LENGTH) })
              }
              className={cn(errors.documento && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.documento ? "true" : "false"}
            />
            {errors.documento ? <p className="text-xs text-destructive">{errors.documento}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="localResidencia">CEP</Label>
            <Input
              id="localResidencia"
              inputMode="numeric"
              value={formData.localResidencia}
              onChange={handleZipChange}
              className={cn(errors.localResidencia && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.localResidencia ? "true" : "false"}
            />
            {errors.localResidencia ? <p className="text-xs text-destructive">{errors.localResidencia}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Input
            id="endereco"
            value={formData.endereco}
            onChange={(event) => setFormData({ ...formData, endereco: event.target.value })}
            readOnly={isZipLookupLoading}
            className={cn(errors.endereco && "border-destructive focus-visible:ring-destructive/40")}
            aria-invalid={errors.endereco ? "true" : "false"}
          />
          {isZipLookupLoading ? <p className="text-xs text-slate-500">Consultando CEP...</p> : null}
          {errors.endereco ? <p className="text-xs text-destructive">{errors.endereco}</p> : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(event) => setFormData({ ...formData, cidade: event.target.value })}
              className={cn(errors.cidade && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.cidade ? "true" : "false"}
            />
            {errors.cidade ? <p className="text-xs text-destructive">{errors.cidade}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Input
              id="estado"
              value={formData.estado}
              onChange={(event) => setFormData({ ...formData, estado: event.target.value })}
              className={cn(errors.estado && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.estado ? "true" : "false"}
            />
            {errors.estado ? <p className="text-xs text-destructive">{errors.estado}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contatoCel">Celular</Label>
            <Input
              id="contatoCel"
              inputMode="numeric"
              value={formData.contatoCel}
              onChange={(event) =>
                setFormData({ ...formData, contatoCel: event.target.value.replace(/\D/g, "").slice(0, CEL_MAX_LENGTH) })
              }
              className={cn(errors.contatoCel && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.contatoCel ? "true" : "false"}
            />
            {errors.contatoCel ? <p className="text-xs text-destructive">{errors.contatoCel}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contato">Email</Label>
            <Input
              id="contato"
              type="email"
              value={formData.contato}
              onChange={(event) => setFormData({ ...formData, contato: event.target.value })}
              className={cn(errors.contato && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.contato ? "true" : "false"}
            />
            {errors.contato ? <p className="text-xs text-destructive">{errors.contato}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="empresaAtual">Empresa Atual</Label>
            <Input
              id="empresaAtual"
              value={formData.empresaAtual}
              onChange={(event) => setFormData({ ...formData, empresaAtual: event.target.value })}
              className={cn(errors.empresaAtual && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.empresaAtual ? "true" : "false"}
            />
            {errors.empresaAtual ? <p className="text-xs text-destructive">{errors.empresaAtual}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cargoAtual">Cargo Atual</Label>
            <Input
              id="cargoAtual"
              value={formData.cargoAtual}
              onChange={(event) => setFormData({ ...formData, cargoAtual: event.target.value })}
              className={cn(errors.cargoAtual && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.cargoAtual ? "true" : "false"}
            />
            {errors.cargoAtual ? <p className="text-xs text-destructive">{errors.cargoAtual}</p> : null}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="senioridade">Senioridade</Label>
            <Select
              value={formData.senioridade}
              onValueChange={(value) => setFormData({ ...formData, senioridade: value })}
            >
              <SelectTrigger
                id="senioridade"
                className={cn("w-full", errors.senioridade && "border-destructive focus-visible:ring-destructive/40")}
                aria-invalid={errors.senioridade ? "true" : "false"}
              >
                <SelectValue placeholder="Selecione a senioridade atual" />
              </SelectTrigger>
              <SelectContent>
                {seniorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.senioridade ? <p className="text-xs text-destructive">{errors.senioridade}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiosAtuais">Beneficios</Label>
            <MultiSelect
              id="beneficiosAtuais"
              options={benefitOptions}
              placeholder="Selecione seus beneficios"
              value={formData.beneficiosAtuais}
              onChange={(value) => setFormData({ ...formData, beneficiosAtuais: value })}
            />
            {errors.beneficiosAtuais ? <p className="text-xs text-destructive">{errors.beneficiosAtuais}</p> : null}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox
            id="lgpdAccepted"
            checked={formData.lgpdAccepted}
            onCheckedChange={(checked) => setFormData({ ...formData, lgpdAccepted: checked === true })}
          />
          <div className="space-y-1">
            <Label htmlFor="lgpdAccepted">Aceito os termos de privacidade e uso de dados</Label>
            <p className="text-xs leading-5 text-slate-500">
              Seus dados serao usados para montar seu perfil dentro da plataforma ClusterHR.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={!isFormComplete}
          className="w-full rounded-full bg-[#FF6B00] text-white hover:bg-[#E55F00]"
        >
          Continuar
        </Button>
      </form>
    </div>
  )
}
