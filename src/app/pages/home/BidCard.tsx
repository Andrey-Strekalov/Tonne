import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { EBidType, type TBid } from '@/shared/types'

const PinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

type TBidCardProps = {
  bid: TBid
  isMine: boolean
  alreadySent: boolean
  onContact: (bid: TBid) => void
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  const w0 = words[0]
  const w1 = words[1]
  if (w0 && w1) { return ((w0[0] ?? '') + (w1[0] ?? '')).toUpperCase() }
  return (w0?.[0] ?? '?').toUpperCase()
}

function fmtNum(s: string): string {
  const n = parseFloat(s.replace(',', '.').replace(/\s/g, ''))
  return isNaN(n) ? s : n.toLocaleString('ru-RU')
}

function fmtPublished(s: string | null): string {
  if (!s) { return '' }
  try {
    return format(parseISO(s), 'dd.MM.yyyy', { locale: ru })
  } catch {
    return ''
  }
}

export function BidCard({ bid, isMine, alreadySent, onContact }: TBidCardProps) {
  const initials = getInitials(bid.author.name)
  const priceDisplay = fmtNum(bid.price)
  const dateStr = fmtPublished(bid.published_at)
  const bidCode = `TN-${bid.id}`
  const isSell = bid.type === EBidType.Sell

  return (
    <div
      className={`grid grid-cols-[1fr_auto] gap-x-7 rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] px-6 pt-[22px] pb-0 transition-colors hover:border-[var(--gk-border-strong)] ${isMine ? 'bg-paper' : 'bg-cream'}`}
    >
      {/* Left: badge + title + quality + region */}
      <div className="min-w-0 pb-4">
        <div className="mb-2.5 flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-2.5 py-[5px] text-[12px] font-semibold leading-none ${
              isSell
                ? `text-green-deep [box-shadow:inset_0_0_0_1px_var(--gk-green)] ${isMine ? 'bg-paper' : 'bg-cream'}`
                : 'bg-green text-cream'
            }`}
          >
            {isSell ? 'Продажа' : 'Покупка'}
          </span>
          <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-[var(--gk-fg-muted)]">
            {bidCode}
          </span>
        </div>
        <h3 className="text-[18px] font-semibold tracking-tight text-ink">{bid.title}</h3>
        {bid.quality.trim() && (
          <p className="mt-1 text-[13px] leading-snug text-[var(--gk-fg-muted)]">{bid.quality}</p>
        )}
        <div className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] text-[var(--gk-graphite,#3A4A3F)]">
          <span className="text-[var(--gk-fg-muted)]"><PinIcon /></span>
          {bid.region}
        </div>
      </div>

      {/* Right: price + volume */}
      <div className="flex flex-col items-end gap-1 pb-4">
        <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[22px] font-semibold tracking-tight text-ink">
          {priceDisplay} ₽
        </p>
        <p className="text-[11px] text-[var(--gk-fg-muted)]">за тонну</p>
        <p className="mt-2 font-['JetBrains_Mono',ui-monospace,monospace] text-[14px] text-[var(--gk-graphite)]">
          <span className="mr-1 font-sans text-[12px] font-normal text-[var(--gk-fg-muted)]">Объём</span>
          {fmtNum(bid.volume)} т
        </p>
      </div>

      {/* Footer: spans both cols */}
      <div className="col-span-2 flex items-center justify-between gap-4 border-t border-[var(--gk-border)] py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--gk-border-strong)] bg-green-deep text-[11px] font-semibold text-cream">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink">
              {bid.author.name || '—'}
              {isMine && (
                <span className="ml-1.5 font-normal text-[var(--gk-fg-muted)]">· вы</span>
              )}
            </p>
            {dateStr && (
              <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-[var(--gk-fg-muted)]">
                Опубликовано {dateStr}
              </p>
            )}
          </div>
        </div>

        {isMine ? (
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-1.5 rounded-[var(--gk-radius)] border border-[var(--gk-border)] px-3.5 py-2 text-[13px] font-semibold text-[var(--gk-fg-muted)] opacity-60"
          >
            Моя заявка
          </button>
        ) : alreadySent ? (
          <button
            type="button"
            disabled
            className="flex cursor-not-allowed items-center gap-1.5 rounded-[var(--gk-radius)] border border-[var(--gk-border)] px-3.5 py-2 text-[13px] font-semibold text-[var(--gk-fg-muted)] opacity-60"
          >
            <CheckIcon /> Запрос отправлен
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { onContact(bid) }}
            className="flex items-center gap-1.5 rounded-[var(--gk-radius)] bg-green px-3.5 py-2 text-[13px] font-semibold text-cream transition-colors hover:bg-green-deep"
          >
            <SendIcon /> Связаться
          </button>
        )}
      </div>
    </div>
  )
}
