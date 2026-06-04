import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { AuthContext, type AuthContextValue } from './auth-context'
import { getMe } from '@/shared/api'
import {
  getAccessToken,
  getRefreshToken,
  hasTokens,
  setTokens as saveTokens,
  clearTokens as removeTokens,
} from '@/shared/lib/auth'
import type { TUser } from '@/shared/types'

type AuthProviderProps = {
  children: ReactNode
}

let currentUserRequest: Promise<TUser> | null = null
let currentUserRequestKey: string | null = null

function getSessionRequestKey(): string {
  return `${getAccessToken() ?? ''}:${getRefreshToken() ?? ''}`
}

async function requestCurrentUser(): Promise<TUser> {
  const requestKey = getSessionRequestKey()

  if (!currentUserRequest || currentUserRequestKey !== requestKey) {
    currentUserRequestKey = requestKey
    currentUserRequest = getMe()
      .then((response) => {
        if (!response.success) {
          throw new Error(response.message ?? 'Не удалось получить данные пользователя')
        }

        return response.user
      })
      .finally(() => {
        currentUserRequest = null
        currentUserRequestKey = null
      })
  }

  return currentUserRequest
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setAuthenticated] = useState(false)
  const [isLoading, setLoading] = useState(true)
  const [user, setUser] = useState<TUser | null>(null)

  const syncSession = useCallback(async () => {
    const nextUser = await requestCurrentUser()
    setUser(nextUser)
    setAuthenticated(true)
  }, [])

  useEffect(() => {
    let isMounted = true

    const bootstrapSession = async () => {
      if (!hasTokens()) {
        if (isMounted) {
          setAuthenticated(false)
          setUser(null)
          setLoading(false)
        }
        return
      }

      try {
        await syncSession()
      } catch {
        removeTokens()
        if (isMounted) {
          setAuthenticated(false)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [syncSession])

  const login = useCallback(async (accessToken: string, refreshToken: string) => {
    saveTokens(accessToken, refreshToken)

    try {
      await syncSession()
    } catch (error) {
      removeTokens()
      setAuthenticated(false)
      setUser(null)
      throw error
    }
  }, [syncSession])

  const logout = useCallback(() => {
    currentUserRequest = null
    currentUserRequestKey = null
    removeTokens()
    setAuthenticated(false)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isLoading, user, login, logout }),
    [isAuthenticated, isLoading, user, login, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
