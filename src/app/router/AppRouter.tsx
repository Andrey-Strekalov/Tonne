import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '@/app/pages/auth/AuthPage'
import { AboutServicePage } from '@/app/pages/home/AboutServicePage'
import { HomePage } from '@/app/pages/home/HomePage'
import { MyBidsPage } from '@/app/pages/home/MyBidsPage'
import { NotFoundPage } from '@/app/pages/not-found/NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/bids" replace />} />
          <Route path="/bids" element={<HomePage />} />
          <Route path="/my-bids" element={<MyBidsPage />} />
          <Route path="/about" element={<AboutServicePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
