const adminMetrics = [
  { label: 'Volume journalier', value: '12,480 USD', tone: 'text-slate-900' },
  { label: 'Commissions accrues', value: '410 USD', tone: 'text-slate-900' },
  { label: 'Ecarts suspects', value: '2 cas', tone: 'text-[var(--elbar-danger)]' },
]

export function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de pilotage</h2>
        <p className="mt-1 text-sm text-[var(--elbar-muted)]">
          Supervision des extensions, validations admin et suivi des risques.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        {adminMetrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              {metric.label}
            </p>
            <p className={`kpi-value mt-2 text-2xl font-bold ${metric.tone}`}>{metric.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <article className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-bold text-slate-900">File de validation</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="rounded-lg bg-slate-50 px-3 py-2">6 depenses en attente</li>
            <li className="rounded-lg bg-slate-50 px-3 py-2">4 clotures a verifier</li>
            <li className="rounded-lg bg-slate-50 px-3 py-2">1 taux de change a mettre a jour</li>
          </ul>
        </article>

        <article className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-base font-bold text-amber-900">Alertes</h3>
          <p className="mt-2 text-sm text-amber-800">
            Extension Goma Centre: ecart CDF superieur au seuil watch.
          </p>
        </article>
      </div>
    </section>
  )
}
