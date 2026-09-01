"use client"

import { useCallback, useEffect, useState } from "react"

import {
  loadAreaOptions,
  type AreaOption,
} from "@/services/areas-service"

export function useAreaOptions() {
  const [options, setOptions] = useState<AreaOption[]>([])
  const [source, setSource] = useState<"api" | null>(null)
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
