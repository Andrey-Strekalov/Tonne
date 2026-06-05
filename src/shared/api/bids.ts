import { request } from './http'
import type {
  TBid,
  TCreateBidRequest,
  TCreateBidResponse,
  TGetBidsResponse,
  EBidType,
} from '@/shared/types'

export type GetBidsParams = {
  type?: EBidType
  author_id?: number
  status?: 'active' | 'archived' | 'all'
  page_size?: number
}

type TBidActionResponse = {
  success: boolean
  bid?: TBid
  message?: string
}

export function createBid(payload: TCreateBidRequest): Promise<TCreateBidResponse> {
  return request<TCreateBidResponse>('/api/v1/bids/', {
    method: 'POST',
    body: payload,
    auth: true,
  })
}

export async function getBids(params?: GetBidsParams): Promise<TBid[]> {
  const searchParams = new URLSearchParams()
  if (params?.type) {searchParams.set('type', params.type)}
  if (params?.author_id !== undefined) {searchParams.set('author_id', String(params.author_id))}
  if (params?.status) {searchParams.set('status', params.status)}
  if (params?.page_size !== undefined) {searchParams.set('page_size', String(params.page_size))}
  const query = searchParams.toString()
  const path = query ? `/api/v1/bids/?${query}` : '/api/v1/bids/'

  const response = await request<TGetBidsResponse>(path, { method: 'GET', auth: true })

  if (!response.success) {
    throw new Error(response.message ?? 'Не удалось получить список заявок.')
  }

  return response.items
}

export async function getBidById(id: number): Promise<TBid> {
  const response = await request<TBidActionResponse>(`/api/v1/bids/${id}/`, {
    method: 'GET',
    auth: true,
  })
  if (!response.success || !response.bid) {
    throw new Error(response.message ?? 'Заявка не найдена.')
  }
  return response.bid
}

export function updateBid(
  id: number,
  data: Partial<TCreateBidRequest>,
): Promise<TBidActionResponse> {
  return request<TBidActionResponse>(`/api/v1/bids/${id}/`, {
    method: 'PATCH',
    body: data,
    auth: true,
  })
}

export function archiveBid(id: number): Promise<TBidActionResponse> {
  return request<TBidActionResponse>(`/api/v1/bids/${id}/archive/`, {
    method: 'PATCH',
    auth: true,
  })
}

export function unarchiveBid(id: number): Promise<TBidActionResponse> {
  return request<TBidActionResponse>(`/api/v1/bids/${id}/unarchive/`, {
    method: 'PATCH',
    auth: true,
  })
}

export function deleteBid(id: number): Promise<{ success: boolean }> {
  return request<{ success: boolean }>(`/api/v1/bids/${id}/`, {
    method: 'DELETE',
    auth: true,
  })
}
