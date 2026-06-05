import { useAuth } from '@/app/providers/auth-context'
import type { ProfileSection } from './ProfilePage'

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)
const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>
  </svg>
)
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

type Props = {
  section: ProfileSection
  onSectionChange: (s: ProfileSection) => void
  bidsCount: number
  unreadContactsCount: number
  companyName: string
}

const ITEMS: { id: ProfileSection; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Профиль', icon: <UserIcon /> },
  { id: 'ads', label: 'Объявления', icon: <ListIcon /> },
  { id: 'contacts', label: 'Контактные заявки', icon: <MailIcon /> },
]

export function ProfileSidebar({ section, onSectionChange, bidsCount, unreadContactsCount, companyName }: Props) {
  const { user } = useAuth()

  const counts = new Map<ProfileSection, number>()
  if (bidsCount > 0) {counts.set('ads', bidsCount)}
  if (unreadContactsCount > 0) {counts.set('contacts', unreadContactsCount)}

  return (
    <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-[232px] shrink-0 flex-col overflow-y-auto border-r border-[var(--gk-border)] bg-paper sm:flex">
      <div className="flex-1 px-4 py-6">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--gk-fg-muted)]">
          Личный кабинет
        </p>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSectionChange(item.id) }}
              className={`flex w-full items-center gap-3 rounded-[var(--gk-radius)] px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                section === item.id
                  ? 'bg-green-soft font-semibold text-green-deep'
                  : 'text-graphite hover:bg-[rgba(14,26,20,.04)] hover:text-ink'
              }`}
            >
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {counts.has(item.id) && (
                <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                  section === item.id
                    ? 'bg-[rgba(31,90,42,.15)] text-green-deep'
                    : 'bg-[rgba(14,26,20,.05)] text-[var(--gk-fg-muted)]'
                }`}>
                  {counts.get(item.id)}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-[var(--gk-border)] px-4 py-4 text-xs text-[var(--gk-fg-muted)]">
        <p>Вы вошли как</p>
        <p className="mt-0.5 font-semibold text-ink">{companyName}</p>
        <p className="mt-0.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[11px]">{user?.phone}</p>
      </div>
    </aside>
  )
}
