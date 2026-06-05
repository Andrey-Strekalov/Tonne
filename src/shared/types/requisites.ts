export interface TRequisites {
  company_name: string
  legal_address: string
  inn: string
  ogrn: string
  bik: string
  bank_name: string
  checking_account: string
  correspondent_account: string
  phone: string
  fax: string
  email: string
}

export interface TRequisitesResponse {
  success: boolean
  requisites: TRequisites
  message?: string
}
