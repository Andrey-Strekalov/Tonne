import { requestRefreshTokens } from './auth-refresh'
import { buildUrl, parseResponseBody, parseErrorMessage } from './core'
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/shared/lib/auth'
import type { RefreshTokenResponse } from '@/shared/types'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  auth?: boolean
  skipAuthRefresh?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function performTokenRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearTokens()
    return null
  }

  try {
    const data: RefreshTokenResponse = await requestRefreshTokens({ refresh_token: refreshToken })

    if (!data.access_token) {
      clearTokens()
      return null
    }

    setTokens(data.access_token, data.refresh_token ?? refreshToken)
    return data.access_token
  } catch {
    clearTokens()
    return null
  }
}

async function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= performTokenRefresh().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

async function createResponse(
  path: string,
  options: RequestOptions
): Promise<Response> {
  const { method = 'GET', body, auth = false, skipAuthRefresh = false } = options
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const accessToken = getAccessToken()
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const requestInit: RequestInit = {
    method,
    headers,
  }

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body)
  }

  const response = await fetch(buildUrl(path), requestInit)

  if (response.status === 401 && auth && !skipAuthRefresh) {
    const refreshedAccessToken = await refreshAccessToken()

    if (refreshedAccessToken) {
      return createResponse(path, {
        ...options,
        skipAuthRefresh: true,
      })
    }
  }

  return response
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await createResponse(path, options)
  const data = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, `Request failed: ${response.status} ${response.statusText}`))
  }

  if (data === undefined) {
    return undefined as T
  }

  if (typeof data === 'string') {
    throw new Error('Invalid JSON response')
  }

  return data as T
}

export { request }
