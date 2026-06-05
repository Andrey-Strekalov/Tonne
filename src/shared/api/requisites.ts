import { request } from './http'
import type { TRequisites, TRequisitesResponse } from '@/shared/types/requisites'

export function getRequisites(): Promise<TRequisitesResponse> {
  return request<TRequisitesResponse>('/api/v1/profile/requisites/', { auth: true })
}

export function updateRequisites(data: Partial<TRequisites>): Promise<TRequisitesResponse> {
  return request<TRequisitesResponse>('/api/v1/profile/requisites/', {
    method: 'PATCH',
    body: data,
    auth: true,
  })
}
