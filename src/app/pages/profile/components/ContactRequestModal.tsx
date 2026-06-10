import { Link } from 'react-router-dom'
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
const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

type Props = {
  contactRequest: TContactRequest
  bid: TBid | null
  direction: 'incoming' | 'outgoing'
  onClose: () => void
}

function fmtNum(s: string): string {
  const n = parseFloat(s.replace(',', '.').replace(/\s/g, ''))
  return isNaN(n) ? s : n.toLocaleString('ru-RU')
}

export function ContactRequestModal({ contactRequest: cr, bid, direction, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(14,26,20,.5)] p-6 backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className="flex w-full max-w-[580px] max-h-[calc(100vh-3rem)] flex-col rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-paper [box-shadow:var(--gk-shadow-lg)]">
        <div className="flex shrink-0 items-start justify-between gap-3 px-7 pt-6 pb-2">
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

        <div className="min-h-0 space-y-3 overflow-y-auto px-7 pb-6 pt-4">
          {/* Bid details */}
          <Section label="Заявка">
            {bid ? (
              <BidDetails bid={bid} />
            ) : (
              <p className="text-sm text-[var(--gk-fg-muted)]">Заявка #{cr.bid_id} — данные недоступны</p>
            )}
          </Section>

          {/* Sender contacts */}
          <Section label="Контакты на момент обращения">
            {direction === 'incoming' ? (
              <Link
                to={`/profile/${cr.sender_id}`}
                className="block text-sm font-semibold text-ink hover:underline"
                onClick={onClose}
              >
                {cr.sender_organization_snapshot || `Пользователь #${cr.sender_id}`}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-ink">
                {cr.sender_organization_snapshot || `Пользователь #${cr.sender_id}`}
              </p>
            )}
            <p className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-sm font-medium text-ink">
              {cr.sender_phone_snapshot}
            </p>
            <div className="mt-2 flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-paper px-2.5 py-2 text-xs text-[var(--gk-fg-muted)]">
              <InfoIcon />
              <span>Данные зафиксированы на момент обращения и не меняются при обновлении профиля.</span>
            </div>
          </Section>

          {cr.comment.trim() && (
            <Section label="Сообщение при запросе">
              <p className="text-sm leading-relaxed text-ink">{cr.comment}</p>
            </Section>
          )}

          <Section label="Дата обращения">
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-ink">
              {formatDateTime(cr.created_at)}
            </span>
          </Section>
        </div>

        <div className="flex shrink-0 justify-end border-t border-[var(--gk-border)] px-7 py-4">
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  )
}

function BidDetails({ bid }: { bid: TBid }) {
  const isBuy = bid.type === EBidType.Buy
  const bidCode = `TN-${bid.id}`

  return (
    <div className="space-y-3">
      {/* Type + code + title */}
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-[5px] text-[12px] font-semibold leading-none ${
          isBuy
            ? 'bg-green text-cream'
            : 'bg-cream text-green-deep [box-shadow:inset_0_0_0_1px_var(--gk-green)]'
        }`}>
          {isBuy ? 'Покупка' : 'Продажа'}
        </span>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold tracking-tight text-ink">{bid.title}</p>
          <p className="mt-0.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-[var(--gk-fg-muted)]">
            {bidCode}
          </p>
        </div>
      </div>

      {/* Price + volume */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-paper px-3 py-2.5">
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">Цена</p>
          <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[15px] font-semibold text-ink">
            {fmtNum(bid.price)} ₽
          </p>
          <p className="text-[11px] text-[var(--gk-fg-muted)]">за тонну</p>
        </div>
        <div className="rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-paper px-3 py-2.5">
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">Объём</p>
          <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[15px] font-semibold text-ink">
            {fmtNum(bid.volume)} т
          </p>
        </div>
      </div>

      {/* Region */}
      <div className="flex items-center gap-1.5 text-[13px] text-[var(--gk-graphite)]">
        <span className="text-[var(--gk-fg-muted)]"><PinIcon /></span>
        {bid.region}
      </div>

      {/* Quality */}
      {bid.quality.trim() && (
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">Качество</p>
          <p className="text-[13px] text-ink">{bid.quality}</p>
        </div>
      )}

      {/* Bid comment */}
      {bid.comment.trim() && (
        <div>
          <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">Комментарий автора</p>
          <p className="text-[13px] leading-relaxed text-ink">{bid.comment}</p>
        </div>
      )}
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
