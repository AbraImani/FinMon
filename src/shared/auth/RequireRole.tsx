import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './authContext'
import type { UserRole } from '../types/domain'

export function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const location = useLocation()
  const { profile, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!profile) {
    return <Navigate to="/connexion" replace />
  }

  if (!profile.role || !allowedRoles.includes(profile.role)) {
    const fallback = location.pathname.startsWith('/agent')
      ? '/agent'
      : location.pathname.startsWith('/admin')
        ? '/admin'
        : profile.role === 'admin'
          ? '/admin'
          : profile.role === 'agent'
            ? '/agent'
            : '/connexion'

    return <Navigate to={fallback} replace />
  }

  return <Outlet />
}
