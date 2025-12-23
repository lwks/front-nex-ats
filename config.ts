const DEFAULT_API_BASE_URL = "https://qqkukhkx3ee4of2muxjlb7f3l40qeari.lambda-url.us-east-1.on.aws/api"
const JOBS_PATH = "/jobs"
const USERS_PATH = "/users"
const CANDIDATES_PATH = "/candidates"
const ZIPS_PATH = "/zips"
const DEFAULT_JOBS_LIST_QUERY = "?limit=20"

function sanitizeBaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined
  }

  const [withoutQuery] = rawUrl.split("?")
  return withoutQuery.replace(/\/+$/, "")
}

const explicitBaseUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)

export const API_BASE_URL = explicitBaseUrl ?? DEFAULT_API_BASE_URL
export const JOBS_API_BASE_URL = API_BASE_URL
export const USERS_API_BASE_URL = API_BASE_URL
export const CANDIDATES_API_BASE_URL = API_BASE_URL

export const USERS_API_URL = `${USERS_API_BASE_URL}${USERS_PATH}`
export const USERS_API_LIST_URL = `${USERS_API_URL}/`
export const CANDIDATES_API_URL = `${CANDIDATES_API_BASE_URL}${CANDIDATES_PATH}`
export const JOBS_API_URL = `${JOBS_API_BASE_URL}${JOBS_PATH}`
export const ZIPS_API_URL = `${API_BASE_URL}${ZIPS_PATH}`

export const JOBS_API_CREATE_URL = JOBS_API_URL
export const CANDIDATES_API_CREATE_URL = CANDIDATES_API_URL
export const JOBS_API_PROXY_URL = "/api/jobs"
export const CANDIDATES_API_PROXY_URL = "/api/candidates"
export const ZIPS_API_DIRECT_URL = `${API_BASE_URL}${ZIPS_PATH}`
export const ZIPS_API_PROXY_URL = "/api/zips"
