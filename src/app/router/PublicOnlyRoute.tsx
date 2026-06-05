import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <p className="text-text-muted">Загрузка...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    const dest = sessionStorage.getItem('post_login_redirect') ?? '/'
    sessionStorage.removeItem('post_login_redirect')
    return <Navigate to={dest} replace />
  }

  return <Outlet />
}
