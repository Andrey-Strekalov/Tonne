import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/kit'

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const BENEFITS = [
  'Укажите реквизиты компании для работы с контрагентами',
  'Ваши данные будут видны только при согласованных сделках',
  'Их можно заполнить позже в разделе «Профиль»',
]

export function OnboardingPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--gk-paper)] px-6 py-12">
      <div className="flex w-full max-w-[420px] flex-col gap-8">

        {/* Wordmark */}
        <div className="flex items-center justify-center gap-2.5 font-display text-[34px] font-extrabold leading-none tracking-[-0.035em] text-[var(--gk-ink)]">
          <span className="grid h-[30px] w-[30px] -translate-y-px place-items-center rounded-[9px] bg-[var(--gk-ink)] text-[18px] font-extrabold tracking-[-0.02em] text-[var(--gk-paper)]">
            Т
          </span>
          <span>Тонна</span>
        </div>

        {/* Heading */}
        <div className="flex flex-col gap-2 text-center">
          <h1 className="m-0 text-[26px] font-bold leading-[1.2] tracking-[-0.025em] text-[var(--gk-ink)]">
            Добро пожаловать!
          </h1>
          <p className="text-[14px] leading-[1.5] text-[var(--gk-fg-muted)]">
            Заполните реквизиты компании, чтобы начать работу с контрагентами.
          </p>
        </div>

        {/* Benefits list */}
        <ul className="flex flex-col gap-3 p-0 m-0 list-none">
          {BENEFITS.map((text) => (
            <li key={text} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--gk-green-soft)] text-[var(--gk-green-deep)]">
                <CheckIcon />
              </span>
              <span className="text-[14px] leading-[1.5] text-[var(--gk-fg-muted)]">{text}</span>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button
            variant="accent"
            className="h-auto w-full py-[14px] text-[15px] font-semibold"
            onClick={() => { void navigate('/profile', { replace: true }) }}
          >
            Заполнить реквизиты
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full py-[14px] text-[15px] font-medium"
            onClick={() => { void navigate('/', { replace: true }) }}
          >
            Пропустить
          </Button>
        </div>

      </div>
    </div>
  )
}
