import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '@/shared/api/profile'
import { updateRequisites } from '@/shared/api/requisites'
import { Button, Input, Label, Textarea } from '@/shared/ui/kit'
import type { TProfile, TRequisites, TRole } from '@/shared/types'
import { cn } from '@/shared/lib'
import { getRoleLabel } from '../profile-utils'

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

type Props = {
  profile: TProfile
  requisites: TRequisites
  onClose: () => void
}

type ReqFields = Omit<TRequisites, 'inn' | 'ogrn' | 'bik' | 'checking_account' | 'correspondent_account'> & {
  inn: string
  ogrn: string
  bik: string
  checking_account: string
  correspondent_account: string
}

export function EditProfileModal({ profile, requisites, onClose }: Props) {
  const queryClient = useQueryClient()
  const [firstName, setFirstName] = useState(profile.first_name)
  const [lastName, setLastName] = useState(profile.last_name)
  const [role, setRole] = useState<TRole>(profile.role)
  const [req, setReq] = useState<ReqFields>({ ...requisites })
  const [error, setError] = useState<string | null>(null)

  const profileMutation = useMutation({ mutationFn: updateProfile })
  const reqMutation = useMutation({ mutationFn: updateRequisites })

  const isPending = profileMutation.isPending || reqMutation.isPending

  const handleReqChange = (field: keyof ReqFields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReq((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await profileMutation.mutateAsync({ first_name: firstName.trim(), last_name: lastName.trim(), role })
      await reqMutation.mutateAsync(req)
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      await queryClient.invalidateQueries({ queryKey: ['requisites'] })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить изменения.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-[rgba(14,26,20,.5)] px-4 py-6 backdrop-blur-[3px] sm:items-center sm:px-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) {onClose()} }}
    >
      <div className="w-full max-w-[600px] rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-[var(--gk-paper)] [box-shadow:var(--gk-shadow-lg)]">
        <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-2">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-ink">Редактировать профиль</h2>
            <p className="mt-1 text-sm text-[var(--gk-fg-muted)]">Личные данные и реквизиты организации</p>
          </div>
          <button
            className="rounded-[var(--gk-radius-sm)] p-1.5 text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.05)] hover:text-ink"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }}>
          <div className="px-7 py-5 space-y-6">
            {/* Personal */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">Личные данные</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ep-firstname" className="text-ink">Имя / отображаемое название</Label>
                  <Input id="ep-firstname" value={firstName} onChange={(e) => { setFirstName(e.target.value) }} placeholder="Ваше имя или название" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-lastname" className="text-ink">Фамилия</Label>
                  <Input id="ep-lastname" value={lastName} onChange={(e) => { setLastName(e.target.value) }} placeholder="Фамилия" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-ink">Роль на платформе</Label>
                <div className="flex gap-2">
                  {(['farmer', 'buyer'] as TRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => { setRole(r) }}
                      className={cn(
                        'rounded-[var(--gk-radius-sm)] border px-4 py-2 text-sm font-semibold transition-colors',
                        role === r
                          ? 'border-green bg-green-soft text-green-deep'
                          : 'border-[var(--gk-border-strong)] bg-paper text-[var(--gk-fg-muted)] hover:text-ink',
                      )}
                    >
                      {getRoleLabel(r)}
                    </button>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Requisites */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">Реквизиты организации</legend>
              <div className="space-y-2">
                <Label htmlFor="ep-company" className="text-ink">Юридическое наименование</Label>
                <Input id="ep-company" value={req.company_name} onChange={handleReqChange('company_name')} placeholder='ООО «Название»' />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ep-address" className="text-ink">Юридический адрес</Label>
                <Textarea id="ep-address" value={req.legal_address} onChange={handleReqChange('legal_address')} placeholder="Индекс, регион, город, улица, дом" rows={2} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ep-inn" className="text-ink">ИНН</Label>
                  <Input id="ep-inn" value={req.inn} onChange={handleReqChange('inn')} placeholder="10 или 12 цифр" className="font-['JetBrains_Mono',ui-monospace,monospace]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-ogrn" className="text-ink">ОГРН</Label>
                  <Input id="ep-ogrn" value={req.ogrn} onChange={handleReqChange('ogrn')} placeholder="13 или 15 цифр" className="font-['JetBrains_Mono',ui-monospace,monospace]" />
                </div>
              </div>
            </fieldset>

            {/* Bank */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">Банковские реквизиты</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ep-bik" className="text-ink">БИК</Label>
                  <Input id="ep-bik" value={req.bik} onChange={handleReqChange('bik')} placeholder="9 цифр" className="font-['JetBrains_Mono',ui-monospace,monospace]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-bank" className="text-ink">Наименование банка</Label>
                  <Input id="ep-bank" value={req.bank_name} onChange={handleReqChange('bank_name')} placeholder="ПАО Сбербанк" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-rs" className="text-ink">Расчётный счёт</Label>
                  <Input id="ep-rs" value={req.checking_account} onChange={handleReqChange('checking_account')} placeholder="20 цифр" className="font-['JetBrains_Mono',ui-monospace,monospace]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-ks" className="text-ink">Корреспондентский счёт</Label>
                  <Input id="ep-ks" value={req.correspondent_account} onChange={handleReqChange('correspondent_account')} placeholder="20 цифр" className="font-['JetBrains_Mono',ui-monospace,monospace]" />
                </div>
              </div>
            </fieldset>

            {/* Contacts */}
            <fieldset className="space-y-4">
              <legend className="text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">Контакты организации</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ep-phone" className="text-ink">Контактный телефон</Label>
                  <Input id="ep-phone" value={req.phone} onChange={handleReqChange('phone')} placeholder="+7 495 000-00-00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ep-fax" className="text-ink">Факс</Label>
                  <Input id="ep-fax" value={req.fax} onChange={handleReqChange('fax')} placeholder="+7 495 000-00-00" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="ep-email" className="text-ink">Email</Label>
                  <Input id="ep-email" type="email" value={req.email} onChange={handleReqChange('email')} placeholder="company@example.ru" />
                </div>
              </div>
            </fieldset>

            {error && <p className="text-sm text-[var(--gk-danger)]">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--gk-border)] px-7 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Отмена</Button>
            <Button type="submit" variant="accent" disabled={isPending}>
              {isPending ? 'Сохраняем...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
