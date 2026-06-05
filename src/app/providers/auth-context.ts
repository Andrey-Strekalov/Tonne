import { createContext, useContext } from 'react'
import type { TUser } from '@/shared/types'

export type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  user: TUser | null
  login: (accessToken: string, refreshToken: string) => Promise<TUser>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}
