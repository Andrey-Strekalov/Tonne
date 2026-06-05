export type TRole = 'farmer' | 'buyer'

export interface TProfile {
  id: number
  phone_number: string
  first_name: string
  last_name: string
  role: TRole
  company_logo: string | null
  date_joined: string
}

export interface TProfileResponse {
  success: boolean
  profile: TProfile
  message?: string
}

export interface TUpdateProfileRequest {
  first_name?: string
  last_name?: string
  role?: TRole
}
