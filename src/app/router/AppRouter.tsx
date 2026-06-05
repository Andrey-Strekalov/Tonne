import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthPage } from '@/app/pages/auth/AuthPage'
import { OnboardingPage } from '@/app/pages/auth/OnboardingPage'
import { AboutServicePage } from '@/app/pages/home/AboutServicePage'
import { ComingSoonPage } from '@/app/pages/home/ComingSoonPage'
import { HomePage } from '@/app/pages/home/HomePage'
import { MyBidsPage } from '@/app/pages/home/MyBidsPage'
import { ProfilePage } from '@/app/pages/profile/ProfilePage'
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
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/" element={<Navigate to="/bids" replace />} />
          <Route path="/bids" element={<HomePage />} />
          <Route path="/my-bids" element={<MyBidsPage />} />
          <Route path="/deals" element={<ComingSoonPage />} />
          <Route path="/counterparties" element={<ComingSoonPage />} />
          <Route path="/about" element={<AboutServicePage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
