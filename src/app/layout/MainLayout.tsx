import { useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { Button } from '@/shared/ui/kit'
import { CreateBid } from '@/app/pages/home/CreateBid'
import { NotificationsPanel } from '@/app/pages/profile/components/NotificationsPanel'
import { getNotifications } from '@/shared/api/notifications'

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
)

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-8 items-center rounded-[var(--gk-radius-sm)] px-3 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-ink text-cream'
      : 'text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,0.05)] hover:text-ink'
  }`

type TMainLayoutProps = {
  children: ReactNode
}

export function MainLayout({ children }: TMainLayoutProps) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [isCreateBidOpen, setCreateBidOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getNotifications({ is_read: false }),
    refetchInterval: 30_000,
    staleTime: 10_000,
  })
  const unreadCount = unreadData?.count ?? 0

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

  const handleGoToContacts = () => {
    void navigate('/profile')
  }

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <header className="sticky top-0 z-20 border-b border-[var(--gk-border)] bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <span className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">тонна</span>

          <nav className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex flex-wrap items-center gap-1">
              <li>
                <NavLink to="/bids" className={navLinkClassName}>
                  Маркет
                </NavLink>
              </li>
              <li>
                <NavLink to="/my-bids" className={navLinkClassName}>
                  Мои заявки
                </NavLink>
              </li>
              <li>
                <NavLink to="/deals" className={navLinkClassName}>
                  Сделки
                </NavLink>
              </li>
              <li>
                <NavLink to="/counterparties" className={navLinkClassName}>
                  Контрагенты
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={navLinkClassName}>
                  О сервисе
                </NavLink>
              </li>
              <li>
                <NavLink to="/profile" className={navLinkClassName}>
                  Профиль
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative" ref={bellRef}>
              <button
                type="button"
                onClick={() => { setNotifOpen(!notifOpen) }}
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  notifOpen
                    ? 'border-ink bg-ink text-cream'
                    : 'border-[var(--gk-border)] bg-transparent text-ink hover:bg-[rgba(14,26,20,.04)]'
                }`}
                title="Уведомления"
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className={`absolute right-2 top-1.5 h-2 w-2 rounded-full border-2 bg-green ${notifOpen ? 'border-ink' : 'border-paper'}`} />
                )}
              </button>
              {notifOpen && (
                <NotificationsPanel
                  onClose={() => { setNotifOpen(false) }}
                  onGoToContacts={handleGoToContacts}
                />
              )}
            </div>

            <Button
              type="button"
              size="sm"
              variant="accent"
              onClick={() => { setCreateBidOpen(true) }}
            >
              Разместить заявку
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={logout}>
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6 sm:py-10">
        {children}
      </main>

      <footer className="border-t border-[var(--gk-border)] bg-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="text-base font-extrabold tracking-[-0.02em] text-ink">тонна</span>
          <p className="text-xs text-[var(--gk-fg-muted)]">Сервис размещения зерновых заявок</p>
          <p className="text-xs text-[var(--gk-fg-muted)]">© 2026</p>
        </div>
      </footer>

      <CreateBid open={isCreateBidOpen} onClose={() => { setCreateBidOpen(false) }} />
    </div>
  )
}
