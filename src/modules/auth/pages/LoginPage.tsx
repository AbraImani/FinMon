import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/auth/authContext'

type LoginMode = 'admin' | 'agent'

interface LoginPageProps {
  mode: LoginMode
}

export function LoginPage({ mode }: LoginPageProps) {
  const navigate = useNavigate()
  const { signIn, signInWithGoogleAdmin, profile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile?.role) {
      return
    }

    navigate(profile.role === 'admin' ? '/admin' : '/agent', { replace: true })
  }, [navigate, profile?.role])

  const handleGoogleAdminSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const profileData = await signInWithGoogleAdmin()

      if (!profileData?.role) {
        throw new Error('Compte introuvable ou profil non configure.')
      }

      navigate('/admin', { replace: true })
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Connexion impossible.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '')
    const password = String(formData.get('password') ?? '')

    try {
      const profileData = await signIn(email, password)

      if (!profileData?.role) {
        throw new Error('Compte introuvable ou profil non configure.')
      }

      navigate(profileData.role === 'admin' ? '/admin' : '/agent', { replace: true })
    } catch (signInError) {
      const message = signInError instanceof Error ? signInError.message : 'Connexion impossible.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="text-center">
        <p className="mx-auto inline-flex items-center rounded-full border border-[rgba(11,110,79,0.16)] bg-[rgba(11,110,79,0.06)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--elbar-brand)]">
          Elbar Company
        </p>
        <h1 className="mt-5 text-3xl font-black text-slate-950 sm:text-4xl">Connexion</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--elbar-muted)]">
          Acces rapide et professionnel selon votre profil.
        </p>
      </div>

      {mode === 'admin' ? (
        <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] sm:p-6">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--elbar-brand)]" />
            Administration
          </div>

          <button
            type="button"
            onClick={handleGoogleAdminSignIn}
            disabled={loading}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Connexion Google...' : 'Se connecter avec Google'}
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Route d&apos;accès: <span className="font-semibold text-slate-700">/admin/connexion</span>
          </p>
        </div>
      ) : (
        <form className="mt-8 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)] sm:p-6" onSubmit={handleSubmit}>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--elbar-accent)]" />
            Espace agent
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--elbar-brand)] focus:ring-4 focus:ring-[rgba(11,110,79,0.12)]"
                placeholder="agent@elbar.cd"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[var(--elbar-brand)] focus:ring-4 focus:ring-[rgba(11,110,79,0.12)]"
                placeholder="••••••••"
              />
            </div>

            {error ? <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--elbar-brand)_0%,var(--elbar-brand-strong)_100%)] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(11,110,79,0.7)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Route d&apos;accès: <span className="font-semibold text-slate-700">/agent/connexion</span>
          </p>
        </form>
      )}
    </div>
  )
}
