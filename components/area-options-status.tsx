type AreaOptionsStatusProps = {
  error?: string
  isLoading: boolean
  onReload: () => void
}

export function AreaOptionsStatus({ error, isLoading, onReload }: AreaOptionsStatusProps) {
  if (!isLoading && !error) {
    return null
  }

  return (
    <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900" role="status">
      <p>{isLoading ? "Carregando áreas..." : error ?? "Nenhuma área disponível."}</p>
      <button type="button" className="mt-1 font-semibold underline" onClick={onReload} disabled={isLoading}>
        {isLoading ? "Recarregando..." : "Recarregar áreas"}
      </button>
    </div>
  )
}
