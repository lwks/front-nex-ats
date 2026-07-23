"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ZIPS_API_PROXY_URL } from "@/config"
import {
  formatZipSummary,
  hasZipCityAndState,
  isRecord,
  normalizeZipResponse,
  pickFirstStringValue,
  type ZipLookupResponse,
} from "@/lib/zip-utils"
import { cn } from "@/lib/utils"
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

type ZipValidationState = {
  endereco: string
  cidade: string
  estado: string
  isCepMissing: boolean
  isCepIncomplete: boolean
  isZipLookupLoading: boolean
  zipLookupError: string | null
  hasZipCityState: boolean
}

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

export function hasManualZipAddress({ endereco, cidade, estado }: Pick<ZipValidationState, "endereco" | "cidade" | "estado">) {
  return endereco.trim().length > 0 && cidade.trim().length > 0 && estado.trim().length > 0
}

export function isZipValidationBlocked(state: ZipValidationState) {
  if (state.isCepMissing || state.isCepIncomplete || state.isZipLookupLoading) {
    return true
  }

  if (state.hasZipCityState) {
    return false
  }

  if (state.zipLookupError) {
    return !hasManualZipAddress(state)
  }

  return !hasManualZipAddress(state)
}

export function getZipValidationMessage(state: ZipValidationState) {
  if (!isZipValidationBlocked(state)) {
    return ""
  }

  if (state.isCepMissing) {
    return "Informe o CEP."
  }

  if (state.isCepIncomplete) {
    return `Informe os ${CEP_LENGTH} digitos do CEP.`
  }

  if (state.isZipLookupLoading) {
    return "Consultando CEP..."
  }

  return state.zipLookupError ?? "Informe um CEP valido."
}

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
    lgpdAccepted: data.lgpdAccepted || false,
  })
  const [touched, setTouched] = useState({
    nome: false,
    documento: false,
    dataNascimento: false,
    localResidencia: false,
    endereco: false,
    cidade: false,
    estado: false,
    contatoCel: false,
    contato: false,
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
  })
  const [isZipLookupLoading, setIsZipLookupLoading] = useState(false)
  const [zipLookupError, setZipLookupError] = useState<string | null>(null)
  const [zipLookupResult, setZipLookupResult] = useState<ZipLookupResponse | null>(null)
  const [hasAttemptedZipLookup, setHasAttemptedZipLookup] = useState(false)
  const zipLookupController = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      zipLookupController.current?.abort()
    }
  }, [])

  const hasZipCityState = hasZipCityAndState(zipLookupResult)
  const isCepMissing = formData.localResidencia.trim().length === 0
  const isCepIncomplete =
    formData.localResidencia.length > 0 && formData.localResidencia.length < CEP_LENGTH
  const shouldValidateZip =
    isCepMissing || hasAttemptedZipLookup || formData.localResidencia.length === CEP_LENGTH
  const zipValidationState = {
    endereco: formData.endereco,
    cidade: formData.cidade,
    estado: formData.estado,
    isCepMissing,
    isCepIncomplete,
    isZipLookupLoading,
    zipLookupError,
    hasZipCityState,
  }
  const isZipBlocked =
    shouldValidateZip &&
    isZipValidationBlocked(zipValidationState)

  const isFormComplete =
    hasFullName(formData.nome) &&
    getDocumentError(formData.documento) === "" &&
    isValidBirthDate(formData.dataNascimento) &&
    !isZipBlocked &&
    hasNonEmptyValue(formData.endereco) &&
    hasNonEmptyValue(formData.cidade) &&
    hasNonEmptyValue(formData.estado) &&
    isValidPhone(formData.contatoCel) &&
    isValidEmail(formData.contato) &&
    formData.lgpdAccepted

  function getZipErrorMessage() {
    if (!shouldValidateZip) {
      return ""
    }

    return getZipValidationMessage(zipValidationState)
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

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === "")
  }

  const updateFieldError = (field: keyof typeof errors, nextValue?: string) => {
    setErrors((previous) => {
      const nextErrors = { ...previous }

      switch (field) {
        case "nome":
          nextErrors.nome = hasFullName(nextValue ?? formData.nome) ? "" : "Informe nome e sobrenome."
          break
        case "documento":
          nextErrors.documento = getDocumentError(nextValue ?? formData.documento)
          break
        case "dataNascimento": {
          const value = nextValue ?? formData.dataNascimento
          nextErrors.dataNascimento = !value
            ? "Informe a data de nascimento."
            : isValidBirthDate(value)
              ? ""
              : "Informe uma data de nascimento valida."
          break
        }
        case "localResidencia":
          nextErrors.localResidencia = getZipErrorMessage()
          break
        case "endereco":
          nextErrors.endereco = hasNonEmptyValue(nextValue ?? formData.endereco) ? "" : "Informe o endereco."
          break
        case "cidade":
          nextErrors.cidade = hasNonEmptyValue(nextValue ?? formData.cidade) ? "" : "Informe a cidade."
          break
        case "estado":
          nextErrors.estado = hasNonEmptyValue(nextValue ?? formData.estado) ? "" : "Informe o estado."
          break
        case "contatoCel":
          nextErrors.contatoCel = isValidPhone(nextValue ?? formData.contatoCel)
            ? ""
            : `Informe um celular com ${CEL_MIN_LENGTH} a ${CEL_MAX_LENGTH} digitos.`
          break
        case "contato":
          nextErrors.contato = isValidEmail(nextValue ?? formData.contato) ? "" : "Digite um e-mail valido."
          break
      }

      return nextErrors
    })
  }

  const touchField = (field: keyof typeof touched) => {
    setTouched((previous) => ({ ...previous, [field]: true }))
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
      if (touched.localResidencia) {
        setTimeout(() => updateFieldError("localResidencia", digitsOnly), 0)
      }
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
          Preencha seus dados pessoais, endereco e informacoes de contato.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {isZipLookupLoading ? (
          <div className="rounded-xl border border-[#FF6B00]/20 bg-orange-50 px-4 py-3 text-sm font-medium text-[#C44E00]">
            Consultando CEP... aguarde o preenchimento automatico terminar.
          </div>
        ) : null}

        <fieldset disabled={isZipLookupLoading} className={cn("space-y-6", isZipLookupLoading && "opacity-60")}>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(event) => {
                const value = event.target.value
                setFormData({ ...formData, nome: value })
                if (touched.nome) {
                  updateFieldError("nome", value)
                }
              }}
              onBlur={() => {
                touchField("nome")
                updateFieldError("nome")
              }}
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
              onChange={(event) => {
                const value = event.target.value
                setFormData({ ...formData, dataNascimento: value })
                if (touched.dataNascimento) {
                  updateFieldError("dataNascimento", value)
                }
              }}
              onBlur={() => {
                touchField("dataNascimento")
                updateFieldError("dataNascimento")
              }}
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
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, CPF_LENGTH)
                setFormData({ ...formData, documento: value })
                if (touched.documento) {
                  updateFieldError("documento", value)
                }
              }}
              onBlur={() => {
                touchField("documento")
                updateFieldError("documento")
              }}
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
              onBlur={() => {
                touchField("localResidencia")
                updateFieldError("localResidencia")
              }}
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
              onChange={(event) => {
                const value = event.target.value
                setFormData({ ...formData, endereco: value })
                if (touched.endereco) {
                  updateFieldError("endereco", value)
                }
              }}
              onBlur={() => {
                touchField("endereco")
                updateFieldError("endereco")
              }}
              className={cn(errors.endereco && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.endereco ? "true" : "false"}
          />
          {zipLookupError ? (
            <p className="text-xs text-amber-700">
              Consulta do CEP indisponivel. Preencha endereco, cidade e estado manualmente.
            </p>
          ) : null}
          {errors.endereco ? <p className="text-xs text-destructive">{errors.endereco}</p> : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(event) => {
                const value = event.target.value
                setFormData({ ...formData, cidade: value })
                if (touched.cidade) {
                  updateFieldError("cidade", value)
                }
              }}
              onBlur={() => {
                touchField("cidade")
                updateFieldError("cidade")
              }}
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
              onChange={(event) => {
                const value = event.target.value
                setFormData({ ...formData, estado: value })
                if (touched.estado) {
                  updateFieldError("estado", value)
                }
              }}
              onBlur={() => {
                touchField("estado")
                updateFieldError("estado")
              }}
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
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, CEL_MAX_LENGTH)
                setFormData({ ...formData, contatoCel: value })
                if (touched.contatoCel) {
                  updateFieldError("contatoCel", value)
                }
              }}
              onBlur={() => {
                touchField("contatoCel")
                updateFieldError("contatoCel")
              }}
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
              onChange={(event) => {
                const value = event.target.value
                setFormData({ ...formData, contato: value })
                if (touched.contato) {
                  updateFieldError("contato", value)
                }
              }}
              onBlur={() => {
                touchField("contato")
                updateFieldError("contato")
              }}
              className={cn(errors.contato && "border-destructive focus-visible:ring-destructive/40")}
              aria-invalid={errors.contato ? "true" : "false"}
            />
            {errors.contato ? <p className="text-xs text-destructive">{errors.contato}</p> : null}
          </div>
        </div>

        <div
          className={cn(
            "flex items-start gap-4 rounded-xl border-2 p-4 transition",
            formData.lgpdAccepted
              ? "border-[#FF6B00] bg-orange-50"
              : "border-slate-300 bg-white shadow-sm",
          )}
        >
          <Checkbox
            id="lgpdAccepted"
            checked={formData.lgpdAccepted}
            onCheckedChange={(checked) => setFormData({ ...formData, lgpdAccepted: checked === true })}
            className="mt-0.5 size-5 border-2 border-[#FF6B00] data-[state=checked]:border-[#FF6B00] data-[state=checked]:bg-[#FF6B00]"
          />
          <div className="space-y-1">
            <Label htmlFor="lgpdAccepted" className="text-sm font-semibold text-slate-950">
              Aceito os termos de privacidade e uso de dados
            </Label>
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
        </fieldset>
      </form>
    </div>
  )
}
