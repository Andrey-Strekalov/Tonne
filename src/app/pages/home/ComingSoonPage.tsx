import { MainLayout } from '@/app/layout/MainLayout'

const ClockIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
)

export function ComingSoonPage() {
  return (
    <MainLayout>
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-[var(--gk-radius-xl)] border border-[var(--gk-border)] bg-cream px-10 py-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gk-border)] bg-paper text-[var(--gk-fg-muted)]">
            <ClockIcon />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">В разработке</h1>
          <p className="mt-2 text-sm text-[var(--gk-fg-muted)]">Этот раздел появится в ближайшее время</p>
        </div>
      </div>
    </MainLayout>
  )
}
