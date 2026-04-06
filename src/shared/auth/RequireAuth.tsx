import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'

export function RequireAuth() {
  const location = useLocation()
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <section className="fintech-card px-6 py-4 text-sm text-[var(--elbar-muted)]">
          Verification de la session...
        </section>
      </main>
    )
  }

  if (!user || !profile) {
    const loginPath = location.pathname.startsWith('/admin')
      ? '/admin/connexion'
      : location.pathname.startsWith('/agent')
        ? '/agent/connexion'
        : '/connexion'

    return <Navigate to={loginPath} replace state={{ from: location.pathname }} />
  }

  if (profile.status === 'disabled') {
    return <Navigate to="/connexion" replace state={{ from: location.pathname, reason: 'disabled' }} />
  }

  return <Outlet />
}
