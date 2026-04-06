import { Link } from 'react-router-dom'

export function AuthLandingPage() {
  return (
    <section className="mx-auto w-full max-w-2xl text-center">
      <div className="space-y-3">
        <p className="mx-auto inline-flex items-center rounded-full border border-[rgba(11,110,79,0.14)] bg-[rgba(11,110,79,0.06)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--elbar-brand)]">
          Elbar Company
        </p>
        <h1 className="text-3xl font-black text-slate-950 sm:text-4xl">Connexion</h1>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          to="/admin/connexion"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-[0_22px_50px_-36px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:border-[rgba(11,110,79,0.28)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--elbar-brand)]">Administration</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Connexion admin</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--elbar-muted)]">
            Accès Google pour les comptes autorisés.
          </p>
        </Link>

        <Link
          to="/agent/connexion"
          className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-[0_22px_50px_-36px_rgba(15,23,42,0.28)] transition hover:-translate-y-1 hover:border-[rgba(14,165,164,0.3)]"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--elbar-accent)]">Agents</p>
          <h2 className="mt-3 text-2xl font-bold text-slate-950">Connexion agent</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--elbar-muted)]">
            Email et mot de passe remis par l&apos;administration.
          </p>
        </Link>
      </div>
    </section>
  )
}
