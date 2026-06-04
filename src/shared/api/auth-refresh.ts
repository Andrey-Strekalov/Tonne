import { buildUrl, parseResponseBody, parseErrorMessage } from './core'
import type { RefreshTokenRequest, RefreshTokenResponse } from '@/shared/types'

export async function requestRefreshTokens(
  payload: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  const response = await fetch(buildUrl('/api/v1/auth/refresh-token/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, `Request failed: ${response.status} ${response.statusText}`))
  }

  if (!data || typeof data !== 'object' || !('access_token' in data)) {
    throw new Error('Invalid refresh response')
  }

  return data as RefreshTokenResponse
}
