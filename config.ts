const DEFAULT_JOBS_API_BASE_URL = "http://127.0.0.1:8000/api/v1"
const JOBS_LIST_PATH = "/vagas"
const DEFAULT_JOBS_LIST_QUERY = "?skip=0&limit=20"
const JOBS_CREATE_PATH = "/applications"

function sanitizeBaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined
  }

  const [withoutQuery] = rawUrl.split("?")
  return withoutQuery.replace(/\/+$/, "")
}

const explicitBaseUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_JOBS_API_BASE_URL)
const listEnvUrl = process.env.NEXT_PUBLIC_JOBS_API_URL

let baseFromListUrl: string | undefined
if (listEnvUrl) {
  const sanitizedListUrl = sanitizeBaseUrl(listEnvUrl)
  if (sanitizedListUrl?.endsWith(JOBS_LIST_PATH)) {
    baseFromListUrl = sanitizedListUrl.slice(0, -JOBS_LIST_PATH.length)
  } else {
    baseFromListUrl = sanitizedListUrl
  }
}

export const JOBS_API_BASE_URL =
  explicitBaseUrl ?? baseFromListUrl ?? DEFAULT_JOBS_API_BASE_URL

export const JOBS_API_LIST_URL =
  listEnvUrl ?? `${JOBS_API_BASE_URL}${JOBS_LIST_PATH}${DEFAULT_JOBS_LIST_QUERY}`

export const JOBS_API_CREATE_URL =
  process.env.NEXT_PUBLIC_JOBS_CREATE_API_URL ?? `${JOBS_API_BASE_URL}${JOBS_CREATE_PATH}`
