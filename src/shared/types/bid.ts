import type { TUser } from './auth'

export enum EBidType {
  Buy = 'buy',
  Sell = 'sell',
}

export interface TBid {
  id: number
  type: EBidType
  title: string
  quality: string
  price: string
  volume: string
  region: string
  comment: string
  published_at: string
  author: TUser
}

export interface TCreateBidRequest {
  type: EBidType
  title: string
  price: string
  volume: string
  region: string
  quality?: string
  comment?: string
}

export type TCreateBidForm = Omit<TCreateBidRequest, 'quality' | 'comment'> & {
  quality: string
  comment: string
}

export type TCreatedBid = TBid

export interface TGetBidsResponse {
  success: boolean
  items: TBid[]
  total: number
  message?: string
}

export interface TCreateBidResponse {
  success: boolean
  bid?: TCreatedBid
  message?: string
}
