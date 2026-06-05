import { useContext, useEffect, useState } from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/kit'
import { confirmCode, requestCode, getRequisites } from '@/shared/api'
import { setTokens } from '@/shared/lib/auth'
import { useAuth } from '@/app/providers/auth-context'

type AuthStep = 'phone' | 'code'

// ── Phone helpers ─────────────────────────────────────────────

const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10 && digits[0] === '9') {return '+7' + digits}
  if (digits.length === 11 && digits[0] === '8') {return '+7' + digits.slice(1)}
  if (digits.length === 11 && digits[0] === '7') {return '+' + digits}
  if (digits.length > 0) {return '+7' + digits.replace(/^[78]?/, '')}
  return value
}

const isPhoneValid = (value: string): boolean => /^\+7\d{10}$/.test(value)

const formatPhone = (normalized: string): string => {
  if (!normalized.startsWith('+7') || normalized.length !== 12) {return normalized}
  const n = normalized.slice(2)
  return `+7 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6, 8)}-${n.slice(8, 10)}`
}

// Format up-to-10 digits as (XXX) XXX-XX-XX
const formatPhoneInput = (digits: string): string => {
  const d = digits.slice(0, 10)
  if (!d) {return ''}
  if (d.length <= 3) {return `(${d}`}
  if (d.length <= 6) {return `(${d.slice(0, 3)}) ${d.slice(3)}`}
  if (d.length <= 8) {return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`}
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`
}

// Strip country code when pasting (+7/8 prefix) and extract local 10 digits
const extractLocalDigits = (input: string): string => {
  const digits = input.replace(/\D/g, '')
  if ((digits.startsWith('7') || digits.startsWith('8')) && digits.length === 11) {
    return digits.slice(1)
  }
  return digits.slice(0, 10)
}

const formatCountdown = (s: number): string =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// ── Icons ─────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ErrorIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

// ── Left Panel ────────────────────────────────────────────────

type LPData = {
  headline: ReactNode
  caption: string
  stat: { value: string; label: string; hidden?: boolean }
}

const LP_PHONE: LPData = {
  headline: (
    <>
      Площадка для&nbsp;<em>зерна и кормов</em>: напрямую между производителем и покупателем
    </>
  ),
  caption: 'Без посредников и наценок. Подтверждённые контрагенты, прозрачные условия поставки.',
  stat: { value: '2 480', label: 'активных заявок' },
}

const LP_OTP: LPData = {
  headline: (
    <>
      Код придёт в&nbsp;<em>SMS</em> в&nbsp;течение минуты
    </>
  ),
  caption: 'Мы используем телефон только для входа и связи по заявкам — никаких рассылок.',
  stat: { value: '96%', label: 'доставка кода < 30 сек', hidden: true },
}

function LeftPanel({ headline, caption, stat }: LPData) {
  return (
    <aside className="relative flex flex-col overflow-hidden bg-[#0E1A14] p-7 text-[#F5F1E6]">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-90"
        viewBox="0 0 260 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="lpGlow" cx="30%" cy="82%" r="60%">
            <stop offset="0%" stopColor="#3F8F4E" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#3F8F4E" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#3F8F4E" stopOpacity="0" />
          </radialGradient>
          <pattern id="lpGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#F5F1E6" strokeOpacity="0.04" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="260" height="720" fill="url(#lpGrid)" />
        <rect width="260" height="720" fill="url(#lpGlow)" />
        <g stroke="#F5F1E6" strokeOpacity="0.18" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <line x1="130" y1="260" x2="130" y2="460" />
          <path d="M 92 285 Q 96 380 108 460" />
          <path d="M 168 285 Q 164 380 152 460" />
        </g>
        <g fill="#7CC46A" opacity="0.85">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <g key={'c' + String(i)} transform={`translate(130 ${258 - i * 16})`}>
              <ellipse cx="-6" cy="0" rx="4" ry="7" transform="rotate(-22 -6 0)" />
              <ellipse cx="6" cy="0" rx="4" ry="7" transform="rotate(22 6 0)" />
            </g>
          ))}
        </g>
        <g fill="#3F8F4E" opacity="0.7">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={'l' + String(i)} transform={`translate(${94 - i * 4} ${285 - i * 16})`}>
              <ellipse cx="-5" cy="0" rx="3.5" ry="6" transform="rotate(-30 -5 0)" />
              <ellipse cx="5" cy="0" rx="3.5" ry="6" transform="rotate(10 5 0)" />
            </g>
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={'r' + String(i)} transform={`translate(${166 + i * 4} ${285 - i * 16})`}>
              <ellipse cx="-5" cy="0" rx="3.5" ry="6" transform="rotate(-10 -5 0)" />
              <ellipse cx="5" cy="0" rx="3.5" ry="6" transform="rotate(30 5 0)" />
            </g>
          ))}
        </g>
        <line x1="0" y1="560" x2="260" y2="560" stroke="#F5F1E6" strokeOpacity="0.10" strokeWidth="1" />
        <g stroke="#F5F1E6" strokeOpacity="0.14" strokeWidth="1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <line key={i} x1={i * 22 + 8} y1="560" x2={i * 22 + 8} y2={i % 3 === 0 ? 552 : 556} />
          ))}
        </g>
      </svg>

      <div className="relative z-10 flex items-center gap-[9px] font-display text-[22px] font-extrabold leading-none tracking-[-0.03em] text-[#F5F1E6]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-lg bg-[#F5F1E6] text-[15px] font-extrabold leading-none tracking-[-0.02em] text-[#0E1A14]">
          Т
        </span>
        <span>Тонна</span>
      </div>

      <div className="relative z-10 mt-auto flex flex-col gap-3.5">
        <div
          className="font-display text-[22px] font-bold leading-[1.18] tracking-[-0.025em] text-[#F5F1E6] [text-wrap:pretty] [&_em]:not-italic [&_em]:text-[#7CC46A]"
          style={{ maxWidth: 260 }}
        >
          {headline}
        </div>
        <div className="text-[12.5px] leading-[1.55] text-[rgba(245,241,230,.58)]" style={{ maxWidth: 260 }}>
          {caption}
        </div>
        {!stat.hidden && (
          <div className="mt-1 flex items-baseline gap-2 border-t border-[rgba(245,241,230,.12)] pt-3 font-mono text-[11px] uppercase tracking-[0.04em] text-[rgba(245,241,230,.72)]">
            <b className="font-display text-[17px] font-bold normal-case tracking-[-0.02em] text-[#F5F1E6]">
              {stat.value}
            </b>
            <span>{stat.label}</span>
          </div>
        )}
      </div>
    </aside>
  )
}

// ── Stepper ───────────────────────────────────────────────────

function Stepper({ step }: { step: 1 | 2 }) {
  const isDone = step === 2
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center px-[18px]">
      <div className="flex w-[70px] flex-col items-center gap-2">
        <div
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full border-[1.5px] text-[13px] font-semibold transition-all',
            isDone
              ? 'border-[var(--gk-green)] bg-[var(--gk-green)] text-white'
              : 'border-[var(--gk-ink)] bg-[var(--gk-ink)] text-[var(--gk-cream)]',
          )}
        >
          {isDone ? <CheckIcon /> : '1'}
        </div>
        <span
          className={cn(
            'text-[12px]',
            isDone ? 'font-medium text-[var(--gk-green-deep)]' : 'font-semibold text-[var(--gk-ink)]',
          )}
        >
          Телефон
        </span>
      </div>

      <div
        className={cn(
          'mx-[-8px] h-[1.5px] -translate-y-2.5 rounded-sm transition-all',
          isDone ? 'bg-[var(--gk-green)]' : 'bg-[var(--gk-border-strong)]',
        )}
      />

      <div className="flex w-[70px] flex-col items-center gap-2">
        <div
          className={cn(
            'grid h-7 w-7 place-items-center rounded-full border-[1.5px] text-[13px] font-semibold transition-all',
            step === 2
              ? 'border-[var(--gk-ink)] bg-[var(--gk-ink)] text-[var(--gk-cream)]'
              : 'border-[var(--gk-border-strong)] bg-transparent text-[var(--gk-fg-muted)]',
          )}
        >
          2
        </div>
        <span
          className={cn(
            'text-[12px]',
            step === 2 ? 'font-semibold text-[var(--gk-ink)]' : 'font-medium text-[var(--gk-fg-muted)]',
          )}
        >
          Код
        </span>
      </div>
    </div>
  )
}

// ── OTP Cells ─────────────────────────────────────────────────

function OtpCells({ hasError }: { hasError: boolean }) {
  const { slots } = useContext(OTPInputContext)
  return (
    <div className="grid grid-cols-4 gap-3">
      {slots.map((slot, i) => (
        <div
          key={i}
          className={cn(
            'relative grid h-[72px] place-items-center rounded-[var(--gk-radius)] border border-[var(--gk-border-strong)] bg-[var(--gk-paper)] transition-all',
            'font-mono text-[28px] font-bold text-[var(--gk-ink)]',
            slot.char && !hasError && 'border-[var(--gk-green)] bg-[var(--gk-green-soft)] text-[var(--gk-green-deep)]',
            slot.isActive && !hasError && 'border-[var(--gk-green)] bg-[var(--gk-paper)] shadow-[0_0_0_2px_rgba(63,143,78,.22)]',
            hasError && 'border-[var(--gk-danger)] bg-[var(--gk-danger-soft)] text-[var(--gk-danger)] shadow-[0_0_0_2px_rgba(176,58,46,.14)]',
          )}
        >
          {slot.char ?? ''}
          {slot.hasFakeCaret && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="animate-caret-blink h-[34px] w-0.5 bg-[var(--gk-ink)]" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── AuthPage ──────────────────────────────────────────────────

export function AuthPage() {
  const { login } = useAuth()
  const [step, setStep] = useState<AuthStep>('phone')
  const [phoneInput, setPhoneInput] = useState('')     // formatted display: "(999) 123-45-67"
  const [normalizedPhone, setNormalizedPhone] = useState('') // "+79991234567", for API calls
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {return}
    const t = setTimeout(() => { setCountdown((c) => c - 1) }, 1000)
    return () => { clearTimeout(t) }
  }, [countdown])

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const localDigits = extractLocalDigits(e.target.value)
    setPhoneInput(formatPhoneInput(localDigits))
    setError(null)
  }

  const handleGetCode = async () => {
    setError(null)
    const normalized = normalizePhone(phoneInput)
    if (!isPhoneValid(normalized)) {
      setError('Введите корректный номер телефона')
      return
    }
    setLoading(true)
    try {
      const res = await requestCode({ phone: normalized })
      if (!res.success) {
        setError(res.message ?? 'Не удалось отправить код. Попробуйте ещё раз.')
        return
      }
      if (import.meta.env.DEV && res.code) {
        setDevCode(res.code)
      } else {
        setDevCode(null)
      }
      setNormalizedPhone(normalized)
      setCode('')
      setCountdown(60)
      setStep('code')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запроса')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeNumber = () => {
    setStep('phone')
    setCode('')
    setError(null)
    setDevCode(null)
  }

  const handleResendCode = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await requestCode({ phone: normalizedPhone })
      if (!res.success) {
        setError(res.message ?? 'Не удалось отправить код.')
        return
      }
      if (import.meta.env.DEV && res.code) {
        setDevCode(res.code)
      } else {
        setDevCode(null)
      }
      setCountdown(60)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запроса')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    const trimmed = code.replace(/\s/g, '')
    if (trimmed.length !== 4) {
      setError('Введите 4-значный код')
      return
    }
    setLoading(true)
    try {
      const res = await confirmCode({ phone: normalizedPhone, code: trimmed })
      if (!res.success) {
        setError(res.message ?? 'Не удалось подтвердить код.')
        return
      }
      if (!res.access_token || !res.refresh_token) {
        setError('Сервер вернул неполные данные авторизации')
        return
      }
      // Сохраняем токены вручную ДО login(), чтобы запрос реквизитов прошёл аутентифицированно
      // пока isAuthenticated ещё false — иначе PublicOnlyRoute успеет сделать redirect раньше
      setTokens(res.access_token, res.refresh_token)
      let destination = '/onboarding'
      try {
        const req = await getRequisites()
        destination = req.success && req.requisites.company_name ? '/' : '/onboarding'
      } catch {
        destination = '/onboarding'
      }
      sessionStorage.setItem('post_login_redirect', destination)
      // Теперь вызываем login() — он установит isAuthenticated=true
      // PublicOnlyRoute прочитает sessionStorage и перенаправит в нужное место
      await login(res.access_token, res.refresh_token)
    } catch (e) {
      sessionStorage.removeItem('post_login_redirect')
      setError(e instanceof Error ? e.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  const isCodeStep = step === 'code'
  const otpHasError = !!error && code.length === 4

  return (
    <div className="grid min-h-screen grid-cols-[390px_1fr]">
      <LeftPanel {...(isCodeStep ? LP_OTP : LP_PHONE)} />

      <div className="flex flex-col items-center justify-center bg-[var(--gk-paper)] px-6 py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-7">

          {/* Wordmark */}
          <div className="flex items-center justify-center gap-2.5 font-display text-[34px] font-extrabold leading-none tracking-[-0.035em] text-[var(--gk-ink)]">
            <span className="grid h-[30px] w-[30px] -translate-y-px place-items-center rounded-[9px] bg-[var(--gk-ink)] text-[18px] font-extrabold tracking-[-0.02em] text-[var(--gk-paper)]">
              Т
            </span>
            <span>Тонна</span>
          </div>

          {/* Stepper */}
          <Stepper step={isCodeStep ? 2 : 1} />

          {/* Heading */}
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[26px] font-bold leading-[1.2] tracking-[-0.025em]">
              {isCodeStep ? 'Введите код' : 'Вход в Тонну'}
            </h1>
            <p className="text-[14px] leading-[1.5] text-[var(--gk-fg-muted)]">
              {isCodeStep ? (
                <>
                  Код отправлен на{' '}
                  <b className="font-semibold text-[var(--gk-ink)]">{formatPhone(normalizedPhone)}</b>
                </>
              ) : (
                'Введите номер телефона — мы пришлём код подтверждения'
              )}
            </p>
            {isCodeStep && (
              <button
                className="mt-1.5 w-fit cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-[var(--gk-green-deep)] underline decoration-[1px] underline-offset-[3px] hover:text-[var(--gk-green)]"
                onClick={handleChangeNumber}
                disabled={loading}
              >
                Изменить номер
              </button>
            )}
          </div>

          {/* ── Phone form ── */}
          {!isCodeStep && (
            <div className="flex flex-col gap-[18px]">
              <div
                className={cn(
                  'flex overflow-hidden rounded-[var(--gk-radius)] border border-[var(--gk-border-strong)] transition-all',
                  'focus-within:border-[var(--gk-green)] focus-within:shadow-[0_0_0_2px_rgba(63,143,78,.18)]',
                  error && 'border-[var(--gk-danger)] shadow-[0_0_0_2px_rgba(176,58,46,.16)]',
                )}
              >
                <span
                  className={cn(
                    'grid place-items-center border-r border-[var(--gk-border)] bg-[var(--gk-cream)] px-3 py-3.5 font-mono text-base font-medium text-[var(--gk-graphite)]',
                    error && 'border-r-[rgba(176,58,46,.25)] bg-[var(--gk-danger-soft)] text-[var(--gk-danger)]',
                  )}
                >
                  +7
                </span>
                <input
                  type="tel"
                  placeholder="(___) ___-__-__"
                  value={phoneInput}
                  onChange={handlePhoneInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter') { void handleGetCode() } }}
                  disabled={loading}
                  autoComplete="tel"
                  className="flex-1 bg-transparent px-4 py-3.5 font-mono text-base font-medium text-[var(--gk-ink)] outline-none placeholder:font-normal placeholder:text-[rgba(14,26,20,.32)]"
                />
              </div>

              {error && (
                <div
                  className="-mt-2 flex items-center gap-2 text-[13px] font-medium text-[var(--gk-danger)]"
                  role="alert"
                >
                  <ErrorIcon />
                  {error}
                </div>
              )}

              <Button
                variant="accent"
                className="h-auto w-full py-[14px] text-[15px] font-semibold"
                onClick={() => { void handleGetCode() }}
                disabled={loading}
              >
                {loading ? 'Отправка…' : 'Получить код'}
              </Button>

              <p className="-mt-2 text-center text-[12px] leading-[1.55] text-[var(--gk-fg-muted)]">
                Нажимая кнопку, вы соглашаетесь с{' '}
                <a
                  href="#"
                  className="text-[var(--gk-graphite)] underline decoration-[1px] underline-offset-[2px] hover:text-[var(--gk-ink)]"
                >
                  условиями платформы
                </a>
              </p>
            </div>
          )}

          {/* ── Code form ── */}
          {isCodeStep && (
            <div className="flex flex-col gap-[18px]">
              {devCode && (
                <div className="flex items-center gap-2 rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-[var(--gk-cream)] px-3 py-2">
                  <span className="text-[12px] text-[var(--gk-fg-muted)]">Код для разработки:</span>
                  <span className="font-mono text-[13px] font-semibold tracking-widest text-[var(--gk-ink)]">
                    {devCode}
                  </span>
                </div>
              )}

              {/* OTP wrapper: Enter to submit, click to clear on error */}
              <div
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && code.length === 4 && !loading) { void handleSubmit() }
                }}
                onClick={() => {
                  if (otpHasError) { setCode(''); setError(null) }
                }}
              >
                <OTPInput
                  maxLength={4}
                  value={code}
                  onChange={(val) => { setCode(val); setError(null) }}
                  disabled={loading}
                  containerClassName="block"
                >
                  <OtpCells hasError={otpHasError} />
                </OTPInput>
              </div>

              {error && (
                <div
                  className="-mt-2 flex items-center justify-center gap-2 text-[13px] font-medium text-[var(--gk-danger)]"
                  role="alert"
                >
                  <ErrorIcon />
                  {error}
                </div>
              )}

              <div className="-mt-1 flex items-center justify-center gap-1.5 text-[13px] text-[var(--gk-fg-muted)]">
                {countdown > 0 ? (
                  <>
                    <span>Отправить код повторно</span>
                    <span className="font-mono font-medium text-[var(--gk-graphite)]">
                      через {formatCountdown(countdown)}
                    </span>
                  </>
                ) : (
                  <button
                    className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-[var(--gk-green-deep)] underline decoration-[1px] underline-offset-[3px] hover:text-[var(--gk-green)] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => { void handleResendCode() }}
                    disabled={loading}
                  >
                    Отправить код повторно
                  </button>
                )}
              </div>

              <Button
                variant="accent"
                className="h-auto w-full py-[14px] text-[15px] font-semibold"
                onClick={() => { void handleSubmit() }}
                disabled={loading || code.length < 4}
              >
                {loading ? 'Вход…' : 'Войти'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
