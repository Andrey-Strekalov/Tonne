import { EBidType, type TBid, type TContactRequest } from '@/shared/types'
import { Button } from '@/shared/ui/kit'
import { formatDateTime } from '../profile-utils'

const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

type Props = {
  contactRequest: TContactRequest
  bid: TBid | null
  direction: 'incoming' | 'outgoing'
  onClose: () => void
}

export function ContactRequestModal({ contactRequest: cr, bid, direction, onClose }: Props) {
  const bidLabel = bid
    ? `${bid.type === EBidType.Buy ? 'Покупка' : 'Продажа'}: ${bid.title}, ${bid.volume} т`
    : `Заявка #${cr.bid_id}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--gk-ink)]/50 p-6 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) {onClose()} }}
    >
      <div className="w-full max-w-[560px] max-h-[calc(100vh-48px)] overflow-y-auto rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-paper [box-shadow:var(--gk-shadow-lg)]">
        <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-2">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-ink">Контактный запрос</h2>
            <p className="mt-1 text-sm text-[var(--gk-fg-muted)]">
              {direction === 'outgoing' ? 'Отправлен вами' : 'Получен по вашему объявлению'}
            </p>
          </div>
          <button
            className="rounded-[var(--gk-radius-sm)] p-1.5 text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.05)] hover:text-ink"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <div className="px-7 pb-6 pt-4 space-y-3">
          <Section label="Объявление">
            <span className="text-sm text-ink">{bidLabel}</span>
          </Section>

          <Section label="Контакты на момент обращения">
            <p className="text-sm font-semibold text-ink">
              {cr.sender_organization_snapshot || `Пользователь #${cr.sender_id}`}
            </p>
            <p className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-sm font-medium text-ink">
              {cr.sender_phone_snapshot}
            </p>
            <div className="mt-2 flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-paper px-2.5 py-2 text-xs text-[var(--gk-fg-muted)]">
              <InfoIcon />
              <span>Данные зафиксированы на момент обращения и не меняются при обновлении профиля.</span>
            </div>
          </Section>

          {cr.comment.trim() && (
            <Section label="Комментарий отправителя">
              <p className="text-sm leading-relaxed text-ink">{cr.comment}</p>
            </Section>
          )}

          <Section label="Дата обращения">
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-ink">
              {formatDateTime(cr.created_at)}
            </span>
          </Section>
        </div>

        <div className="flex justify-end border-t border-[var(--gk-border)] px-7 py-4">
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream px-4 py-3.5">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">{label}</p>
      {children}
    </div>
  )
}
