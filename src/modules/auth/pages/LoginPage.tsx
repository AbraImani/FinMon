import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../shared/auth/authContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, profile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!profile?.role) {
      return
    }

    navigate(profile.role === 'admin' ? '/admin' : '/agent', { replace: true })
  }, [navigate, profile?.role])

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
    <>
      <h1 className="text-2xl font-bold text-slate-900">Connexion securisee</h1>
      <p className="mt-2 text-sm text-[var(--elbar-muted)]">
        Acces reserve aux utilisateurs crees par l&apos;administrateur.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="email">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--elbar-brand)] focus:outline-none"
            placeholder="agent@elbar.cd"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700" htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-xl border border-[var(--elbar-border)] bg-white px-3 py-2.5 text-sm focus:border-[var(--elbar-brand)] focus:outline-none"
            placeholder="********"
          />
        </div>

        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--elbar-brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--elbar-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </>
  )
}
