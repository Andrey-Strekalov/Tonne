export interface RequestCodeRequest {
  phone: string
}

export interface RequestCodeResponse {
  success: boolean
  code?: string
  expires_in?: number
  message?: string
}

export interface ConfirmCodeRequest {
  phone: string
  code: string
}

export interface ConfirmCodeResponse {
  success: boolean
  access_token?: string
  refresh_token?: string
  message?: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  success?: boolean
  access_token: string
  refresh_token?: string
  message?: string
}

export interface TUser {
  id: number
  phone: string
  name: string
  company_logo?: string | null
  company_name?: string | null
}

export interface AuthMeResponse {
  success: boolean
  user: TUser
  message?: string
}
