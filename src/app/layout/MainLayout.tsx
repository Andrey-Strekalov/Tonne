import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { NotificationsPanel } from '@/app/pages/profile/components/NotificationsPanel'
import { getNotifications } from '@/shared/api/notifications'
import { getProfile } from '@/shared/api/profile'
import { getRequisites } from '@/shared/api/requisites'
import { getInitials } from '@/app/pages/profile/profile-utils'

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
)

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center rounded-[var(--gk-radius)] py-2 px-[14px] text-sm font-medium transition-colors ${
    isActive
      ? 'bg-ink text-cream'
      : 'text-[var(--gk-graphite)] hover:bg-[rgba(14,26,20,0.04)] hover:text-ink'
  }`

type TMainLayoutProps = {
  children: ReactNode
}

export function MainLayout({ children }: TMainLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)
  const avatarRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getNotifications({ is_read: false }),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
  const unreadCount = unreadData?.count ?? 0

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })
  const { data: reqData } = useQuery({
    queryKey: ['requisites'],
    queryFn: getRequisites,
  })

  const companyName = reqData?.requisites.company_name ?? ''
  const companyLogo = profileData?.profile.company_logo ?? null
  const initials = getInitials(companyName, profileData?.profile.first_name ?? '')

  useEffect(() => {
    if (!notifOpen) {return}
    const handle = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    const t = setTimeout(() => { document.addEventListener('click', handle) }, 0)
    return () => { clearTimeout(t); document.removeEventListener('click', handle) }
  }, [notifOpen])

  useEffect(() => {
    if (!avatarOpen) {return}
    const handle = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false)
      }
    }
    const t = setTimeout(() => { document.addEventListener('click', handle) }, 0)
    return () => { clearTimeout(t); document.removeEventListener('click', handle) }
  }, [avatarOpen])

  return (
    <div className="flex min-h-screen flex-col bg-[var(--gk-paper)]">
      <header className="sticky top-0 z-20 h-16 border-b border-[var(--gk-border)] bg-[var(--gk-paper)]">
        <div className="flex h-full items-center gap-10 px-8">
          <span className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">Тонна</span>

          <nav>
            <ul className="m-0 flex list-none items-center gap-1 p-0">
              <li>
                <NavLink to="/bids" className={navLinkClassName}>Маркет</NavLink>
              </li>
              <li>
                <NavLink to="/my-bids" className={navLinkClassName}>Мои заявки</NavLink>
              </li>
              <li>
                <NavLink to="/deals" className={navLinkClassName}>Сделки</NavLink>
              </li>
              <li>
                <NavLink to="/counterparties" className={navLinkClassName}>Контрагенты</NavLink>
              </li>
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => { setNotifOpen(!notifOpen) }}
                className={`relative grid h-[38px] w-[38px] place-items-center rounded-full border transition-colors ${
                  notifOpen
                    ? 'border-ink bg-ink text-cream'
                    : 'border-[var(--gk-border)] bg-transparent text-ink hover:bg-[rgba(14,26,20,.04)]'
                }`}
                title="Уведомления"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span
                    className={`absolute right-2 top-[7px] h-[9px] w-[9px] rounded-full border-2 bg-green ${notifOpen ? 'border-ink' : 'border-[var(--gk-paper)]'}`}
                  />
                )}
              </button>
              {notifOpen && (
                <NotificationsPanel
                  onClose={() => { setNotifOpen(false) }}
                  onGoToContacts={(crId?: number) => {
                    void navigate(
                      '/profile?section=contacts',
                      crId !== undefined ? { state: { crId } } : {},
                    )
                  }}
                />
              )}
            </div>

            {/* Avatar */}
            <div className="relative" ref={avatarRef}>
              <button
                type="button"
                onClick={() => { setAvatarOpen((o) => !o) }}
                className="grid h-[38px] w-[38px] cursor-pointer place-items-center overflow-hidden rounded-full border border-[var(--gk-border-strong)] bg-[#3F8F4E] text-[13px] font-semibold text-white"
                title={companyName || 'Профиль'}
              >
                {companyLogo ? (
                  <img src={companyLogo} alt={companyName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </button>
              {avatarOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[160px] overflow-hidden rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-[var(--gk-paper)] py-1 shadow-[var(--gk-shadow)]">
                  <button
                    type="button"
                    onClick={() => { void navigate('/profile'); setAvatarOpen(false) }}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[var(--gk-graphite)] hover:bg-[rgba(14,26,20,.04)] hover:text-ink"
                  >
                    <UserIcon />
                    Мой профиль
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-[var(--gk-graphite)] hover:bg-[rgba(14,26,20,.04)] hover:text-ink"
                  >
                    <LogoutIcon />
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-[var(--gk-border)] bg-[var(--gk-paper)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-base font-extrabold tracking-[-0.02em] text-ink">Тонна</span>
          <p className="text-xs text-[var(--gk-fg-muted)]">Сервис размещения зерновых заявок</p>
          <p className="text-xs text-[var(--gk-fg-muted)]">© 2026</p>
        </div>
      </footer>
    </div>
  )
}
