import { request } from './http'
import type { TContactRequestsResponse, TContactRequestResponse, TCreateContactRequest } from '@/shared/types/contact'

export function getContactRequests(params?: {
  direction?: 'incoming' | 'outgoing'
  is_read?: boolean
}): Promise<TContactRequestsResponse> {
  const sp = new URLSearchParams()
  if (params?.direction) {sp.set('direction', params.direction)}
  if (params?.is_read !== undefined) {sp.set('is_read', String(params.is_read))}
  const q = sp.toString()
  return request<TContactRequestsResponse>(
    q ? `/api/v1/contact-requests/?${q}` : '/api/v1/contact-requests/',
    { auth: true },
  )
}

export function createContactRequest(data: TCreateContactRequest): Promise<TContactRequestResponse> {
  return request<TContactRequestResponse>('/api/v1/contact-requests/', {
    method: 'POST',
    body: data,
    auth: true,
  })
}

export function markContactRequestRead(id: number): Promise<TContactRequestResponse> {
  return request<TContactRequestResponse>(`/api/v1/contact-requests/${id}/read/`, {
    method: 'POST',
    auth: true,
  })
}
