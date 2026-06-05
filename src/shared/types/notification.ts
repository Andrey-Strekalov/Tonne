export interface TNotificationPayload {
  bid_title?: string
  sender_first_name?: string
  [key: string]: unknown
}

export interface TNotification {
  id: number
  type: string
  contact_request_id: number | null
  payload: TNotificationPayload | null
  is_read: boolean
  created_at: string
}

export interface TNotificationsResponse {
  count: number
  results: TNotification[]
}
