export function LocalHarnessBar() {
  return (
    <aside aria-label="Ambiente local" className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <strong>Ambiente local · dados fictícios</strong>
        <form action="/api/local/profile" method="post" className="flex gap-2">
          <button name="profile" value="COMPANY" className="rounded border border-amber-600 px-3 py-1">Entrar como empresa</button>
          <button name="profile" value="CANDIDATE" className="rounded border border-amber-600 px-3 py-1">Entrar como candidato</button>
        </form>
      </div>
    </aside>
  )
}
