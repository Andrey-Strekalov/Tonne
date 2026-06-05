export interface TContactRequest {
  id: number
  bid_id: number
  sender_id: number
  receiver_id: number
  comment: string
  sender_phone_snapshot: string
  sender_organization_snapshot: string
  is_read: boolean
  created_at: string
}

export interface TContactRequestsResponse {
  success: boolean
  contact_requests: TContactRequest[]
  message?: string
}

export interface TContactRequestResponse {
  success: boolean
  contact_request: TContactRequest
  message?: string
}

export interface TCreateContactRequest {
  bid_id: number
  comment?: string
}
