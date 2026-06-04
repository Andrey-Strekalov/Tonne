import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}
