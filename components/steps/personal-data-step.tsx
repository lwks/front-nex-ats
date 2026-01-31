"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { ZIPS_API_PROXY_URL } from "@/config"
import type { CandidateData } from "../candidate-onboarding"

interface PersonalDataStepProps {
  data: Partial<CandidateData>
  onUpdate: (data: Partial<CandidateData>) => void
  onNext: () => void
}

const CPF_LENGTH = 11
const RG_MIN_LENGTH = 7
const RG_MAX_LENGTH = 10
const CEP_LENGTH = 8
const CEL_MIN_LENGTH = 10
const CEL_MAX_LENGTH = 11

const hasFullName = (value: string) => value.trim().split(/\s+/).length >= 2

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

const isValidEmail = (value: string) => {
  if (!value) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value)
}

const isValidPhone = (value: string) =>
  value.length >= CEL_MIN_LENGTH && value.length <= CEL_MAX_LENGTH

const getDocumentError = (value: string) => {
  if (!value) {
    return "Informe seu CPF ou RG."
  }

  if (value.length === CPF_LENGTH) {
    return validateCpf(value) ? "" : "Informe um CPF válido."
  }

  if (value.length >= RG_MIN_LENGTH && value.length <= RG_MAX_LENGTH) {
    return ""
  }

  return `Informe um CPF com ${CPF_LENGTH} dígitos ou um RG entre ${RG_MIN_LENGTH} e ${RG_MAX_LENGTH} dígitos.`
}

type ZipLookupResponse = {
  cep?: string
  logradouro?: string
  bairro?: string
  localidade?: string
  uf?: string
  cidade?: string
  estado?: string
  street?: string
  neighborhood?: string
  city?: string
  state?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

function pickFirstStringValue(data: ZipLookupResponse, keys: string[]): string | undefined {
  for (const key of keys) {
    const rawValue = data[key]
    if (typeof rawValue === "string") {
      const trimmed = rawValue.trim()
      if (trimmed.length > 0) {
        return trimmed
      }
    }
  }

  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

function normalizeZipResponse(rawData: ZipLookupResponse | null, cep: string): ZipLookupResponse {
  const normalizedData: ZipLookupResponse = rawData ? { ...rawData } : {}
  const nestedData = isRecord(rawData?.data) ? (rawData?.data as Record<string, unknown>) : null

  if (nestedData) {
    for (const [key, value] of Object.entries(nestedData)) {
      if (normalizedData[key] === undefined) {
        normalizedData[key] = value
      }
    }
  }

  if (typeof normalizedData.cep !== "string" && cep.length > 0) {
    normalizedData.cep = cep
  }

  return normalizedData
}

function formatZipSummary(data: ZipLookupResponse): string | null {
  const street = pickFirstStringValue(data, ["logradouro", "street", "address"])
  const neighborhood = pickFirstStringValue(data, ["bairro", "neighborhood"])
  const city = pickFirstStringValue(data, ["localidade", "cidade", "city"])
  const state = pickFirstStringValue(data, ["uf", "estado", "state"])

  const segments: string[] = []

  if (street) {
    segments.push(street)
  }

  if (neighborhood) {
    segments.push(neighborhood)
  }

  if (city && state) {
    segments.push(`${city}/${state}`)
  } else if (city) {
    segments.push(city)
  } else if (state) {
    segments.push(state)
  }

  if (segments.length === 0) {
    const cepValue = pickFirstStringValue(data, ["cep"])
    return cepValue ?? null
  }

  return segments.join(" - ")
}

export function PersonalDataStep({ data, onUpdate, onNext }: PersonalDataStepProps) {
  const [formData, setFormData] = useState({
    nome: data.nome || "",
    documento: (data.documento || "").replace(/\D/g, ""),
    localResidencia: (data.localResidencia || "").replace(/\D/g, ""),
    endereco: data.endereco || "",
    contatoCel: (data.contatoCel || "").replace(/\D/g, ""),
    contato: data.contato || "",
    lgpdAccepted: data.lgpdAccepted || false,
  })
  const [errors, setErrors] = useState({
    nome: "",
    documento: "",
    localResidencia: "",
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

  const zipSummary = zipLookupResult ? formatZipSummary(zipLookupResult) : null
  const zipCity = zipLookupResult
    ? pickFirstStringValue(zipLookupResult, ["localidade", "cidade", "city"])
    : undefined
  const zipState = zipLookupResult ? pickFirstStringValue(zipLookupResult, ["uf", "estado", "state"]) : undefined
  const hasZipCityState = Boolean(zipCity && zipState)
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
    !isZipValidationBlocked &&
    Boolean(formData.endereco.trim()) &&
    isValidPhone(formData.contatoCel) &&
    isValidEmail(formData.contato) &&
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
    const newErrors = { nome: "", documento: "", localResidencia: "", contatoCel: "", contato: "" }

    newErrors.nome = hasFullName(formData.nome) ? "" : "Informe nome e sobrenome."
    newErrors.documento = getDocumentError(formData.documento)
    newErrors.localResidencia = getZipErrorMessage()
    newErrors.contatoCel = isValidPhone(formData.contatoCel)
      ? ""
      : `Informe um celular com ${CEL_MIN_LENGTH} a ${CEL_MAX_LENGTH} digitos.`
    newErrors.contato = isValidEmail(formData.contato) ? "" : "Digite um e-mail válido."

    setErrors(newErrors)
    return Object.values(newErrors).every((error) => error === "")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateFields()) {
      return
    }
    if (!formData.lgpdAccepted) {
      alert("Por favor, aceite os termos da LGPD para continuar.")
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
    setFormData((previous) => ({ ...previous, endereco: "" }))
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
      setZipLookupResult(normalizedResult)
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
      setFormData((previous) => ({ ...previous, endereco: "" }))
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
      setFormData((previous) => ({ ...previous, endereco: "" }))
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

  useEffect(() => {
    if (!zipLookupResult) {
      return
    }

    const summary = formatZipSummary(zipLookupResult)
    setFormData((previous) => ({
      ...previous,
      endereco: summary ?? "",
    }))
  }, [zipLookupResult])

  return (
    <>
      {isZipLookupLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-5 shadow-xl">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-muted-foreground">Consultando CEP...</p>
          </div>
        </div>
      ) : null}
      <div className="bg-card rounded-lg shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-center mb-8 text-foreground">Dados Pessoais</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Digite seu nome completo"
              value={formData.nome}
              onChange={(e) => {
                if (errors.nome) {
                  setErrors((previous) => ({ ...previous, nome: "" }))
                }
                setFormData({ ...formData, nome: e.target.value })
              }}
              onBlur={() => {
                const error = hasFullName(formData.nome) ? "" : "Informe nome e sobrenome."
                if (error !== errors.nome) {
                  setErrors((previous) => ({ ...previous, nome: error }))
                }
              }}
              required
              className="bg-input"
              aria-invalid={errors.nome ? "true" : "false"}
            />
            {errors.nome ? <p className="text-xs text-destructive">{errors.nome}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="documento">Documento</Label>
            <Input
              id="documento"
              type="text"
              placeholder="CPF ou RG"
              value={formData.documento}
              onChange={(e) => {
                if (errors.documento) {
                  setErrors((previous) => ({ ...previous, documento: "" }))
                }
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, CPF_LENGTH)
                setFormData({ ...formData, documento: digitsOnly })
              }}
              onBlur={() => {
                const error = getDocumentError(formData.documento)
                if (error !== errors.documento) {
                  setErrors((previous) => ({ ...previous, documento: error }))
                }
              }}
              required
              className="bg-input"
              aria-invalid={errors.documento ? "true" : "false"}
              inputMode="numeric"
              maxLength={CPF_LENGTH}
            />
            {errors.documento ? <p className="text-xs text-destructive">{errors.documento}</p> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="localResidencia">CEP</Label>
              <Input
                id="localResidencia"
                type="text"
                placeholder="Somente numeros"
                value={formData.localResidencia}
                onChange={handleZipChange}
                onBlur={() => {
                  const error = getZipErrorMessage()
                  if (error !== errors.localResidencia) {
                    setErrors((previous) => ({ ...previous, localResidencia: error }))
                  }
                }}
                required
                className="bg-input"
                inputMode="numeric"
                maxLength={CEP_LENGTH}
                aria-invalid={errors.localResidencia ? "true" : "false"}
              />
              {errors.localResidencia ? (
                <p className="text-xs text-destructive">{errors.localResidencia}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                type="text"
                placeholder="Preenchido automaticamente"
                value={formData.endereco}
                readOnly
                className="bg-input"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contatoCel">Contato cel</Label>
              <Input
                id="contatoCel"
                type="text"
                placeholder="DDD + numero"
                value={formData.contatoCel}
                onChange={(e) => {
                  if (errors.contatoCel) {
                    setErrors((previous) => ({ ...previous, contatoCel: "" }))
                  }
                  const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, CEL_MAX_LENGTH)
                  setFormData({ ...formData, contatoCel: digitsOnly })
                }}
                onBlur={() => {
                  const error = isValidPhone(formData.contatoCel)
                    ? ""
                    : `Informe um celular com ${CEL_MIN_LENGTH} a ${CEL_MAX_LENGTH} digitos.`
                  if (error !== errors.contatoCel) {
                    setErrors((previous) => ({ ...previous, contatoCel: error }))
                  }
                }}
                required
                className="bg-input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={CEL_MAX_LENGTH}
                aria-invalid={errors.contatoCel ? "true" : "false"}
              />
              {errors.contatoCel ? <p className="text-xs text-destructive">{errors.contatoCel}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato">E-mail</Label>
              <Input
                id="contato"
                type="email"
                placeholder="seu@email.com"
                value={formData.contato}
                onChange={(e) => {
                  if (errors.contato) {
                    setErrors((previous) => ({ ...previous, contato: "" }))
                  }
                  setFormData({ ...formData, contato: e.target.value })
                }}
                onBlur={() => {
                  const error = isValidEmail(formData.contato) ? "" : "Digite um e-mail válido."
                  if (error !== errors.contato) {
                    setErrors((previous) => ({ ...previous, contato: error }))
                  }
                }}
                required
                className="bg-input"
                aria-invalid={errors.contato ? "true" : "false"}
              />
              {errors.contato ? <p className="text-xs text-destructive">{errors.contato}</p> : null}
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-4">
            <Checkbox
              id="lgpd"
              checked={formData.lgpdAccepted}
              onCheckedChange={(checked) => setFormData({ ...formData, lgpdAccepted: checked as boolean })}
              className="bg-card border-muted-foreground/60"
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="lgpd" className="text-sm font-normal cursor-pointer">
                Confirmação LGPD
              </Label>
              <p className="text-xs text-muted-foreground">
                Aceito o compartilhamento dos meus dados conforme a Lei Geral de Proteção de Dados
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className={cn(
              "w-full mt-8",
              isFormComplete
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
            size="lg"
            disabled={!isFormComplete}
          >
            Continuar
          </Button>
        </form>
      </div>
    </>
  )
}
