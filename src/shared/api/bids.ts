import { request } from './http'
import type { TBid, TCreateBidRequest, TCreateBidResponse, TGetBidsResponse, EBidType } from '@/shared/types'

export type GetBidsParams = {
  type?: EBidType
  author_id?: number
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
  if (params?.type) {
    searchParams.set('type', params.type)
  }
  if (params?.author_id !== undefined) {
    searchParams.set('author_id', String(params.author_id))
  }
  const query = searchParams.toString()
  const path = query ? `/api/v1/bids/?${query}` : '/api/v1/bids/'

  const response = await request<TGetBidsResponse>(path, {
    method: 'GET',
    auth: true,
  })

  if (!response.success) {
    throw new Error(response.message ?? 'Не удалось получить список заявок.')
  }

  return response.items
}
