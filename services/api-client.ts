import { API_BASE_URL as RAW_API_BASE_URL } from "@/config"

const API_BASE_URL = RAW_API_BASE_URL?.replace(/\/$/, "")

export const isApiConfigured = Boolean(API_BASE_URL)

function buildUrl(path: string): string {
  if (!API_BASE_URL) {
    throw new Error("API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL to enable API calls.")
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export async function apiFetch<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const url = buildUrl(path)
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText)
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

export async function apiFetchWithFallback<TResponse>(
  path: string,
  fallback: TResponse,
  init?: RequestInit,
): Promise<TResponse> {
  if (!isApiConfigured) {
    return fallback
  }

  try {
    return await apiFetch<TResponse>(path, init)
  } catch (error) {
    console.error(`Failed to fetch ${path}:`, error)
    return fallback
  }
}
