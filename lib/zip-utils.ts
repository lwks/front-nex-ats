export type ZipLookupResponse = {
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
  data?: Record<string, unknown> | string
  [key: string]: unknown
}

const CITY_STATE_PATTERN = /^(.+?)\s*\/\s*([A-Za-z]{2})$/

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object"
}

export function pickFirstStringValue(data: ZipLookupResponse, keys: string[]): string | undefined {
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

function parseCityAndStateFromText(rawValue: string): { city?: string; state?: string } {
  const parts = rawValue
    .split(/\s*-\s*/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)

  if (parts.length === 0) {
    return {}
  }

  const cityStateCandidate = parts[parts.length - 1]
  const match = cityStateCandidate.match(CITY_STATE_PATTERN)

  if (!match) {
    return {}
  }

  return {
    city: match[1].trim(),
    state: match[2].trim().toUpperCase(),
  }
}

function assignValueIfMissing(target: ZipLookupResponse, keys: string[], value: string | undefined) {
  if (!value) {
    return
  }

  for (const key of keys) {
    const currentValue = target[key]
    if (typeof currentValue !== "string" || currentValue.trim().length === 0) {
      target[key] = value
    }
  }
}

export function normalizeZipResponse(rawData: ZipLookupResponse | null, cep: string): ZipLookupResponse {
  const normalizedData: ZipLookupResponse = rawData ? { ...rawData } : {}

  if (isRecord(rawData?.data)) {
    for (const [key, value] of Object.entries(rawData.data)) {
      if (normalizedData[key] === undefined) {
        normalizedData[key] = value
      }
    }
  }

  if (typeof rawData?.data === "string") {
    const parsedLocation = parseCityAndStateFromText(rawData.data)
    assignValueIfMissing(normalizedData, ["localidade", "cidade", "city"], parsedLocation.city)
    assignValueIfMissing(normalizedData, ["uf", "estado", "state"], parsedLocation.state)
  }

  if (typeof normalizedData.cep !== "string" && cep.length > 0) {
    normalizedData.cep = cep
  }

  return normalizedData
}

export function formatZipSummary(data: ZipLookupResponse): string | null {
  const rawLocation = typeof data.data === "string" ? data.data.trim() : ""
  if (rawLocation.length > 0) {
    return rawLocation
  }

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
    const cep = pickFirstStringValue(data, ["cep"])
    return cep ?? null
  }

  return segments.join(" · ")
}

export function hasZipCityAndState(data: ZipLookupResponse | null): boolean {
  if (!data) {
    return false
  }

  const city = pickFirstStringValue(data, ["localidade", "cidade", "city"])
  const state = pickFirstStringValue(data, ["uf", "estado", "state"])

  return Boolean(city && state)
}
