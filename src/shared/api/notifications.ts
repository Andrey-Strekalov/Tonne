import { request } from './http'
import type { TNotificationsResponse } from '@/shared/types/notification'

export function getNotifications(params?: { is_read?: boolean }): Promise<TNotificationsResponse> {
  const sp = new URLSearchParams()
  if (params?.is_read !== undefined) {sp.set('is_read', String(params.is_read))}
  const q = sp.toString()
  return request<TNotificationsResponse>(
    q ? `/api/v1/notifications/?${q}` : '/api/v1/notifications/',
    { auth: true },
  )
}

export function markNotificationRead(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/v1/notifications/${id}/read/`, {
    method: 'POST',
    auth: true,
  })
}

export function markAllNotificationsRead(): Promise<{ success: boolean; updated: number }> {
  return request<{ success: boolean; updated: number }>('/api/v1/notifications/read-all/', {
    method: 'POST',
    auth: true,
  })
}
