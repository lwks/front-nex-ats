"use client"

import { useCallback, useEffect, useState } from "react"

import {
  fallbackAreaOptions,
  loadAreaOptions,
  type AreaOption,
} from "@/services/areas-service"

export function useAreaOptions() {
  const [options, setOptions] = useState<AreaOption[]>(fallbackAreaOptions)
  const [source, setSource] = useState<"api" | "fallback" | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)

  const reload = useCallback(async () => {
    setIsLoading(true)
    const result = await loadAreaOptions()
    setOptions(result.options)
    setSource(result.source)
    setError(result.error)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { options, source, error, isLoading, reload }
}
