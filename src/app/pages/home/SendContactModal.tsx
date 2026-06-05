import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { createContactRequest } from '@/shared/api/contacts'
import { getProfile } from '@/shared/api/profile'
import { getRequisites } from '@/shared/api/requisites'
import { EBidType, type TBid } from '@/shared/types'
import { Button } from '@/shared/ui/kit'

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

type Props = {
  bid: TBid
  alreadySent: boolean
  onClose: () => void
  onSent: () => void
}

function fmtPrice(s: string): string {
  const n = parseFloat(s.replace(',', '.').replace(/\s/g, ''))
  return isNaN(n) ? s : n.toLocaleString('ru-RU')
}

export function SendContactModal({ bid, alreadySent, onClose, onSent }: Props) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [comment, setComment] = useState('')

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: getProfile })
  const { data: reqData } = useQuery({ queryKey: ['requisites'], queryFn: getRequisites })

  const phone = profileData?.profile.phone_number ?? user?.phone ?? ''
  const org = reqData?.requisites.company_name ?? user?.name ?? ''

  const { mutate, isPending, isError } = useMutation({
    mutationFn: () => {
      const trimmed = comment.trim()
      return trimmed
        ? createContactRequest({ bid_id: bid.id, comment: trimmed })
        : createContactRequest({ bid_id: bid.id })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact-requests', 'outgoing'] })
      onSent()
    },
  })

  const priceDisplay = fmtPrice(bid.price)
  const isSell = bid.type === EBidType.Sell

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--gk-ink)]/50 p-6 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className="w-full max-w-[560px] max-h-[calc(100vh-48px)] overflow-y-auto rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-paper [box-shadow:var(--gk-shadow-lg)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-2">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-ink">Контактный запрос</h2>
            <p className="mt-1 text-sm text-[var(--gk-fg-muted)]">Автор увидит ваши контакты и комментарий</p>
          </div>
          <button
            className="rounded-[var(--gk-radius-sm)] p-1.5 text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.05)] hover:text-ink"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <div className="space-y-4 px-7 pb-6 pt-4">
          {/* Bid preview */}
          <div className="rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream px-4 py-3.5">
            <div className="mb-2.5 flex items-center gap-2.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-[5px] text-[12px] font-semibold leading-none ${
                  isSell
                    ? 'bg-cream text-green-deep [box-shadow:inset_0_0_0_1px_var(--gk-green)]'
                    : 'bg-green text-cream'
                }`}
              >
                {isSell ? 'Продажа' : 'Покупка'}
              </span>
              <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-[var(--gk-fg-muted)]">
                TN-{bid.id}
              </span>
            </div>
            <p className="text-base font-semibold tracking-tight text-ink">{bid.title}</p>
            <div className="mt-2.5 flex flex-wrap gap-4 border-t border-dashed border-[var(--gk-border)] pt-2.5">
              <MetaItem label="Цена" value={`${priceDisplay} ₽/т`} mono />
              <MetaItem label="Объём" value={`${bid.volume} т`} mono />
              <MetaItem label="Регион" value={bid.region} />
              <MetaItem label="Автор" value={bid.author.name || '—'} />
            </div>
          </div>

          {/* Already sent banner */}
          {alreadySent && (
            <div className="flex items-center gap-2.5 rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-cream px-3 py-2.5 text-[12.5px] text-[var(--gk-fg-muted)]">
              <span className="text-green"><CheckIcon /></span>
              <span>
                <strong className="font-semibold text-ink">Запрос уже отправлен.</strong>{' '}
                Автор получил ваши контакты.
              </span>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--gk-graphite,#3A4A3F)]">
              Комментарий{' '}
              <span className="font-normal text-[var(--gk-fg-muted)]">· необязательно</span>
            </label>
            <textarea
              className="w-full resize-y rounded-[var(--gk-radius-sm)] border border-[var(--gk-border-strong)] bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-[var(--gk-fg-muted)] focus:border-green focus:outline-none disabled:opacity-60"
              rows={3}
              placeholder="Укажите объём, сроки или другие детали…"
              value={comment}
              onChange={(e) => { setComment(e.target.value) }}
              disabled={alreadySent}
            />
          </div>

          {/* Contact note */}
          <div className="flex items-start gap-2.5 rounded-[var(--gk-radius-sm)] border border-[rgba(31,90,42,.18)] bg-green-soft px-3 py-2.5 text-[12.5px] leading-relaxed text-green-deep">
            <span className="mt-0.5 shrink-0"><InfoIcon /></span>
            <span>
              Ваши контакты{' '}
              {phone && (
                <span className="font-['JetBrains_Mono',ui-monospace,monospace] font-medium">{phone}</span>
              )}
              {phone && org && ' · '}
              {org && <strong className="font-semibold">{org}</strong>}
              {!phone && !org && 'из вашего профиля'}{' '}
              будут переданы автору заявки. Изменения профиля после отправки не повлияют на эту запись.
            </span>
          </div>

          {isError && (
            <p className="text-sm text-red-600">Не удалось отправить запрос. Попробуйте ещё раз.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-[var(--gk-border)] px-7 py-4">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button
            variant="accent"
            disabled={alreadySent || isPending}
            onClick={() => { mutate() }}
          >
            {alreadySent ? 'Запрос уже отправлен' : isPending ? 'Отправка…' : 'Отправить'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">
        {label}
      </span>
      <span
        className={`text-sm text-ink ${mono ? "font-['JetBrains_Mono',ui-monospace,monospace] font-medium" : ''}`}
      >
        {value}
      </span>
    </div>
  )
}
