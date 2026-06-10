// Vite предоставляет переменные окружения с префиксом VITE_ через import.meta.env
const getEnv = (key: string): string => {
  const value = import.meta.env[key]
  if (value === undefined || value === '') {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

export const apiBaseUrl = getEnv('VITE_API_BASE_URL')

export const wsBaseUrl = apiBaseUrl
  .replace(/^https:\/\//, 'wss://')
  .replace(/^http:\/\//, 'ws://')
