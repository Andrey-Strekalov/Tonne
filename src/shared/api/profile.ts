import { request } from './http'
import { buildUrl } from './core'
import { getAccessToken } from '@/shared/lib/auth'
import type { TProfileResponse, TUpdateProfileRequest } from '@/shared/types/profile'

export function getProfile(): Promise<TProfileResponse> {
  return request<TProfileResponse>('/api/v1/profile/', { auth: true })
}

export function getUserProfile(userId: number): Promise<TProfileResponse> {
  return request<TProfileResponse>(`/api/v1/profile/${userId}/`, { auth: true })
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

export async function uploadAvatar(file: File): Promise<TProfileResponse> {
  const formData = new FormData()
  formData.append('company_logo', file)

  const token = getAccessToken()
  const headers: Record<string, string> = {}
  if (token) { headers['Authorization'] = `Bearer ${token}` }

  const response = await fetch(buildUrl('/api/v1/profile/'), {
    method: 'PATCH',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const text = await response.text()
    let msg = 'Не удалось загрузить фото.'
    try {
      const parsed = JSON.parse(text) as { message?: string }
      if (parsed.message) { msg = parsed.message }
    } catch { /* ignore */ }
    throw new Error(msg)
  }

  return response.json() as Promise<TProfileResponse>
}
