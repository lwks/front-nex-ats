const DEFAULT_API_BASE_URL = "https://qqkukhkx3ee4of2muxjlb7f3l40qeari.lambda-url.us-east-1.on.aws/api"
const JOBS_PATH = "/jobs"
const USERS_PATH = "/users"
const CANDIDATES_PATH = "/candidates"
const CANDIDATES_BY_JOB_GUIDS_PATH = "/candidates/by-job-guids"
const APPLICATIONS_PATH = "/applications"
const ZIPS_PATH = "/zips"
const DEFAULT_JOBS_LIST_QUERY = "?limit=20"

function sanitizeBaseUrl(rawUrl?: string) {
  if (!rawUrl) {
    return undefined
  }

  const [withoutQuery] = rawUrl.split("?")
  return withoutQuery.replace(/\/+$/, "")
}

function sanitizeScopes(rawScopes?: string) {
  if (!rawScopes) {
    return "openid profile email"
  }

  return rawScopes
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean)
    .join(" ")
}

const explicitBaseUrl = sanitizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)
const explicitCognitoDomain = sanitizeBaseUrl(process.env.COGNITO_DOMAIN)

export const API_BASE_URL = explicitBaseUrl ?? DEFAULT_API_BASE_URL
export const JOBS_API_BASE_URL = API_BASE_URL
export const USERS_API_BASE_URL = API_BASE_URL
export const CANDIDATES_API_BASE_URL = API_BASE_URL

export const USERS_API_URL = `${USERS_API_BASE_URL}${USERS_PATH}`
export const USERS_API_LIST_URL = `${USERS_API_URL}/`
export const CANDIDATES_API_URL = `${CANDIDATES_API_BASE_URL}${CANDIDATES_PATH}`
export const CANDIDATES_BY_JOB_GUIDS_API_URL = `${CANDIDATES_API_BASE_URL}${CANDIDATES_BY_JOB_GUIDS_PATH}`
export const COMPANY_APPLICATIONS_API_URL = `${API_BASE_URL}${APPLICATIONS_PATH}/company`
export const JOBS_API_URL = `${JOBS_API_BASE_URL}${JOBS_PATH}`
export const ZIPS_API_URL = `${API_BASE_URL}${ZIPS_PATH}`

export const JOBS_API_CREATE_URL = JOBS_API_URL
export const CANDIDATES_API_CREATE_URL = CANDIDATES_API_URL
export const JOBS_API_PROXY_URL = "/api/jobs"
export const CANDIDATES_API_PROXY_URL = "/api/candidates"
export const CANDIDATES_BY_JOB_GUIDS_API_PROXY_URL = "/api/candidates/by-job-guids"
export const ZIPS_API_DIRECT_URL = `${API_BASE_URL}${ZIPS_PATH}`
export const ZIPS_API_PROXY_URL = "/api/zips"

export const COGNITO_DOMAIN = explicitCognitoDomain
export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID
export const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET
export const COGNITO_REDIRECT_URI = process.env.COGNITO_REDIRECT_URI
export const COGNITO_SCOPES = sanitizeScopes(process.env.COGNITO_SCOPES)
export const COGNITO_AUTHORIZE_URL = COGNITO_DOMAIN ? `${COGNITO_DOMAIN}/oauth2/authorize` : undefined
export const COGNITO_TOKEN_URL = COGNITO_DOMAIN ? `${COGNITO_DOMAIN}/oauth2/token` : undefined

export { DEFAULT_JOBS_LIST_QUERY }
