import { NavLink, Outlet } from 'react-router-dom'

const menu = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/utilisateurs', label: 'Utilisateurs' },
  { to: '/admin/extensions', label: 'Extensions' },
  { to: '/admin/transactions', label: 'Transactions' },
  { to: '/admin/depenses', label: 'Depenses' },
  { to: '/admin/rapports', label: 'Rapports' },
  { to: '/admin/audit', label: 'Audit' },
]

export function AdminLayout() {
  return (
    <div className="min-h-screen px-4 py-4 lg:px-6">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="fintech-card h-fit p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--elbar-brand)]">
            ELBAR COMPANY
          </p>
          <h1 className="mt-2 text-lg font-bold text-slate-900">Administration</h1>
          <nav className="mt-4 space-y-1">
            {menu.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[var(--elbar-brand)] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="fintech-card min-h-[78vh] p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
