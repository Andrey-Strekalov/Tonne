import { request } from './http'
import type { TProfileResponse, TUpdateProfileRequest } from '@/shared/types/profile'

export function getProfile(): Promise<TProfileResponse> {
  return request<TProfileResponse>('/api/v1/profile/', { auth: true })
}

export function updateProfile(data: TUpdateProfileRequest): Promise<TProfileResponse> {
  return request<TProfileResponse>('/api/v1/profile/', {
    method: 'PATCH',
    body: data,
    auth: true,
  })
}

export function deleteProfile(): Promise<{ success: boolean }> {
  return request<{ success: boolean }>('/api/v1/profile/', {
    method: 'DELETE',
    auth: true,
  })
}
