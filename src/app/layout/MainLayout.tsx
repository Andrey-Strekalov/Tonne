import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/app/providers/auth-context'
import { Button } from '@/shared/ui/kit'
import { CreateBid } from '@/app/pages/home/CreateBid'
import logoLockup from '@/assets/logo-lockup.svg'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `inline-flex h-8 items-center rounded-[var(--gk-radius-sm)] px-3 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-green-soft text-green-deep'
      : 'text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,0.05)] hover:text-ink'
  }`

type TMainLayoutProps = {
  children: ReactNode
}

export function MainLayout({ children }: TMainLayoutProps) {
  const { logout } = useAuth()
  const [isCreateBidOpen, setCreateBidOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      <header className="sticky top-0 z-20 border-b border-[var(--gk-border)] bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <img src={logoLockup} alt="Гектар" className="h-8 w-auto" />

          <nav className="order-3 w-full sm:order-none sm:w-auto">
            <ul className="flex flex-wrap items-center gap-1">
              <li>
                <NavLink to="/bids" className={navLinkClassName}>
                  Заявки
                </NavLink>
              </li>
              <li>
                <NavLink to="/my-bids" className={navLinkClassName}>
                  Мои заявки
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={navLinkClassName}>
                  О сервисе
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
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
          <img src={logoLockup} alt="Гектар" className="h-6 w-auto" />
          <p className="text-xs text-[var(--gk-fg-muted)]">Сервис размещения зерновых заявок</p>
          <p className="text-xs text-[var(--gk-fg-muted)]">© 2026</p>
        </div>
      </footer>

      <CreateBid open={isCreateBidOpen} onClose={() => { setCreateBidOpen(false) }} />
    </div>
  )
}
