import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoLockup from '@/assets/logo-lockup.svg'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Label,
} from '@/shared/ui/kit'
import { confirmCode, requestCode } from '@/shared/api'
import { useAuth } from '@/app/providers/auth-context'
import type { ConfirmCodeResponse, RequestCodeResponse } from '@/shared/types'

type AuthStep = 'phone' | 'code'

const normalizePhone = (value: string): string => {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10 && digits[0] === '9') {
    return '+7' + digits
  }
  if (digits.length === 11 && digits[0] === '8') {
    return '+7' + digits.slice(1)
  }
  if (digits.length === 11 && digits[0] === '7') {
    return '+' + digits
  }
  if (digits.length > 0) {
    return '+7' + digits.replace(/^[78]?/, '')
  }
  return value
}

const isPhoneValid = (value: string): boolean => {
  return /^\+7\d{10}$/.test(value)
}

const getRequestCodeError = (response: RequestCodeResponse): string => {
  return response.message ?? 'Не удалось отправить код. Попробуйте еще раз.'
}

const getConfirmCodeError = (response: ConfirmCodeResponse): string => {
  return response.message ?? 'Не удалось подтвердить код. Попробуйте еще раз.'
}

export function AuthPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [step, setStep] = useState<AuthStep>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  const handleGetCode = async () => {
    setError(null)
    const normalized = normalizePhone(phone.trim())
    if (!isPhoneValid(normalized)) {
      setError('Введите корректный номер телефона')
      return
    }
    setLoading(true)
    try {
      const res = await requestCode({ phone: normalized })
      if (!res.success) {
        setError(getRequestCodeError(res))
        return
      }

      if (import.meta.env.DEV && res.code) {
        setDevCode(res.code)
      } else {
        setDevCode(null)
      }

      setPhone(normalized)
      setStep('code')
      setCode('')
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
    if (!isPhoneValid(phone)) {
      setError('Сначала укажите корректный номер телефона')
      return
    }

    setLoading(true)
    try {
      const res = await requestCode({ phone })
      if (!res.success) {
        setError(getRequestCodeError(res))
        return
      }

      if (import.meta.env.DEV && res.code) {
        setDevCode(res.code)
      } else {
        setDevCode(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка запроса')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError(null)
    const trimmed = code.replace(/\s/g, '')
    if (!trimmed) {
      setError('Введите код')
      return
    }

    if (trimmed.length !== 4) {
      setError('Код должен содержать 4 цифры')
      return
    }
    setLoading(true)
    try {
      const res = await confirmCode({ phone, code: trimmed })
      if (!res.success) {
        setError(getConfirmCodeError(res))
        return
      }

      if (!res.access_token || !res.refresh_token) {
        setError('Сервер вернул неполные данные авторизации')
        return
      }

      await login(res.access_token, res.refresh_token)
      await navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-page-bg px-4 py-8 sm:px-6 sm:py-10">
      <div className="w-full max-w-sm sm:max-w-md min-w-0 space-y-5 sm:space-y-6">
        <div className="flex flex-col items-center gap-3">
          <img src={logoLockup} alt="Гектар" className="h-10 w-auto" />
          <p className="text-xs text-[var(--gk-fg-muted)]">
            Маркетплейс зерновых заявок
          </p>
        </div>

        <Card>
          {step === 'phone' && (
            <>
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-ink">Вход</CardTitle>
                <CardDescription className="text-[var(--gk-fg-muted)]">
                  Введите номер телефона, мы отправим код
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-ink">
                    Номер телефона
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+7 (999) 000-00-00"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); }}
                    autoComplete="tel"
                    disabled={loading}
                  />
                </div>
                <Button
                  type="button"
                  variant="accent" className="w-full"
                  onClick={() => { void handleGetCode() }}
                  disabled={loading}
                >
                  {loading ? 'Отправка...' : 'Получить код'}
                </Button>
              </CardContent>
            </>
          )}

          {step === 'code' && (
            <>
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-ink">
                  Подтверждение
                </CardTitle>
                <CardDescription className="text-[var(--gk-fg-muted)]">
                  Введите код из сообщения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <p className="text-sm text-red-600" role="alert">
                    {error}
                  </p>
                )}
                {devCode && (
                  <p className="text-xs text-text-muted">
                    Код для разработки: {devCode}
                  </p>
                )}
                <div className="space-y-2">
                  <Label className="text-ink">Код</Label>
                  <InputOTP
                    maxLength={4}
                    value={code}
                    onChange={setCode}
                    disabled={loading}
                  >
                    <InputOTPGroup className="justify-center">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  type="button"
                  variant="accent" className="w-full"
                  onClick={() => { void handleSubmit() }}
                  disabled={loading}
                >
                  {loading ? 'Вход...' : 'Войти'}
                </Button>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-ink"
                    onClick={handleChangeNumber}
                    disabled={loading}
                  >
                    Изменить номер
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="w-full text-text-muted"
                    onClick={() => { void handleResendCode() }}
                    disabled={loading}
                  >
                    Отправить код повторно
                  </Button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
