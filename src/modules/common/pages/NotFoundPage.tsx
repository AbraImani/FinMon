import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="fintech-card w-full max-w-lg p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--elbar-brand)]">
          ELBAR COMPANY
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-sm text-[var(--elbar-muted)]">
          Cette ressource n&apos;existe pas ou votre profil n&apos;a pas acces.
        </p>
        <Link
          to="/connexion"
          className="mt-6 inline-flex rounded-xl bg-[var(--elbar-brand)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Retour a la connexion
        </Link>
      </section>
    </main>
  )
}
