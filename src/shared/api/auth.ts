import { requestRefreshTokens } from './auth-refresh'
import { request } from './http'
import type {
  RequestCodeRequest,
  RequestCodeResponse,
  ConfirmCodeRequest,
  ConfirmCodeResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthMeResponse,
} from '@/shared/types'

export function requestCode(payload: RequestCodeRequest): Promise<RequestCodeResponse> {
  return request<RequestCodeResponse>('/api/v1/auth/request-code/', {
    method: 'POST',
    body: payload,
  })
}

export function confirmCode(payload: ConfirmCodeRequest): Promise<ConfirmCodeResponse> {
  return request<ConfirmCodeResponse>('/api/v1/auth/confirm-code/', {
    method: 'POST',
    body: payload,
  })
}

export function refreshTokens(payload: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return requestRefreshTokens(payload)
}

export function getMe(): Promise<AuthMeResponse> {
  return request<AuthMeResponse>('/api/v1/auth/me/', {
    auth: true,
  })
}
