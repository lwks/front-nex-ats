import type { AreaOption } from "@/services/areas-service"

type AreaOptionsStatusProps = {
  error?: string
  isLoading: boolean
  onReload: () => void
  options: AreaOption[]
  source: "api" | "fallback" | null
}

export function AreaOptionsStatus({ error, isLoading, onReload, options, source }: AreaOptionsStatusProps) {
  if (source !== "fallback") {
    return null
  }

  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">
      <p>Áreas locais em uso ({options.length}). {error ?? "A API não respondeu."}</p>
      <button type="button" className="mt-1 font-semibold underline" onClick={onReload} disabled={isLoading}>
        {isLoading ? "Recarregando..." : "Recarregar áreas"}
      </button>
    </div>
  )
}
