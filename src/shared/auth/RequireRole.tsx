import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './authContext'
import type { UserRole } from '../types/domain'

export function RequireRole({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!profile) {
    return <Navigate to="/connexion" replace />
  }

  if (!profile.role || !allowedRoles.includes(profile.role)) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/connexion'} replace />
  }

  return <Outlet />
}
