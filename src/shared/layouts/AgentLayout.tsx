import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/agent', label: 'Accueil' },
  { to: '/agent/operations', label: 'Operation' },
  { to: '/agent/depenses', label: 'Depenses' },
  { to: '/agent/cloture', label: 'Cloture' },
]

export function AgentLayout() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 py-4 sm:py-6">
      <header className="fintech-card p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--elbar-brand)]">
          ELBAR COMPANY
        </p>
        <h1 className="mt-2 text-xl font-bold text-slate-900">Espace Agent</h1>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Operations terrain rapides et reconciliation journaliere.
        </p>
      </header>

      <section className="my-4 flex-1">
        <Outlet />
      </section>

      <nav className="fintech-card sticky bottom-3 grid grid-cols-4 p-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `rounded-lg px-2 py-2 text-center text-xs font-semibold transition ${
                isActive
                  ? 'bg-[var(--elbar-brand)] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
