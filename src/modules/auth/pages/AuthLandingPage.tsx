import { Link } from 'react-router-dom'

export function AuthLandingPage() {
  return (
    <section className="mx-auto w-full max-w-xl text-center">
      <div className="space-y-3">
        <p className="mx-auto inline-flex items-center rounded-full border border-[rgba(11,110,79,0.16)] bg-[rgba(11,110,79,0.06)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--elbar-brand)]">
          Elbar Company
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Connexion</h1>
        <p className="mx-auto max-w-lg text-sm leading-6 text-[var(--elbar-muted)]">
          Choisissez votre espace pour accéder au tableau de bord correspondant.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/connexion"
          className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-[rgba(11,110,79,0.28)] hover:shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--elbar-brand)]">Administration</p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">Connexion admin</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--elbar-muted)]">
            Entrée Google dédiée aux comptes autorisés.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(11,110,79,0.06)] px-3 py-1 text-xs font-semibold text-[var(--elbar-brand)]">
            /admin/connexion
          </div>
        </Link>

        <Link
          to="/agent/connexion"
          className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 text-left shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] transition hover:-translate-y-1 hover:border-[rgba(14,165,164,0.3)] hover:shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--elbar-accent)]">Agents / Extensions</p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">Connexion agent</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--elbar-muted)]">
            Accès avec les identifiants fournis par l&apos;administration.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[rgba(14,165,164,0.08)] px-3 py-1 text-xs font-semibold text-[var(--elbar-accent)]">
            /agent/connexion
          </div>
        </Link>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white/80 px-4 py-3 text-xs leading-5 text-slate-500 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
        La page est adaptée pour mobile, tablette et ordinateur.
      </div>
    </section>
  )
}
