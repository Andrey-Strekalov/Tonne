import { apiBaseUrl } from '@/shared/config'

export function buildUrl(path: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

export async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function parseErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    if ('detail' in data && data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    }
    if ('message' in data && typeof data.message === 'string') {
      return data.message
    }
  }
  if (typeof data === 'string' && data) {
    return data
  }
  return fallback
}
