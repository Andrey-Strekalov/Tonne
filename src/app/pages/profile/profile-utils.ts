import type { TRole } from '@/shared/types'

export function getRoleLabel(role: TRole): string {
  return role === 'farmer' ? 'Продавец' : 'Покупатель'
}

export function getDisplayName(companyName: string): string {
  return companyName.trim() || 'Имя не указано'
}

export function getInitials(companyName: string, fallback = ''): string {
  const source = companyName.trim() || fallback.trim()
  if (!source) {return '??'}
  const cleaned = source
    .replace(/^(ООО|ИП|АО|ПАО|ОАО|КФХ|ЗАО)\s+/i, '')
    .replace(/[«»""]/g, '')
    .trim()
  const words = cleaned.split(/[\s-]+/).filter(Boolean)
  const w0 = words[0]
  const w1 = words[1]
  if (w0 && w1) {return ((w0[0] ?? '') + (w1[0] ?? '')).toUpperCase()}
  if (w0 && w0.length >= 2) {return w0.slice(0, 2).toUpperCase()}
  return source.slice(0, 2).toUpperCase()
}

export function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function formatJoinedDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(new Date(iso))
  } catch {
    return iso
  }
}
