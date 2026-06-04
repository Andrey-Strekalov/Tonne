import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button, Card } from '@/shared/ui/kit'
import { EBidType, type TBid } from '@/shared/types'

const bidTypeLabel: Record<EBidType, string> = {
  [EBidType.Buy]: 'Покупка',
  [EBidType.Sell]: 'Продажа',
}

const bidTypeBadgeClass: Record<EBidType, string> = {
  [EBidType.Buy]:
    'bg-green text-cream',
  [EBidType.Sell]:
    'bg-cream text-green-deep [box-shadow:inset_0_0_0_1.5px_var(--gk-green)]',
}

type TBidCardProps = {
  bid: TBid
}

function formatPublishedAt(value?: string): string | null {
  if (!value) {
    return null
  }

  try {
    return format(parseISO(value), 'dd MMMM yyyy, HH:mm', { locale: ru })
  } catch {
    return null
  }
}

export function BidCard({ bid }: TBidCardProps) {
  const publishedAt = formatPublishedAt(bid.published_at)
  const authorName = bid.author.name.trim()
  const hasMeta = Boolean(authorName || publishedAt)

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-150 hover:[box-shadow:var(--gk-shadow)]">
      <div className="flex flex-1 flex-col gap-3 px-4 pb-3 pt-4 sm:gap-3.5 sm:px-5 sm:pb-4 sm:pt-5">
        <div className="flex items-center">
          <span
            className={`inline-flex rounded-[6px] px-2.5 py-1 text-[11px] font-semibold leading-tight tracking-wide ${bidTypeBadgeClass[bid.type]}`}
          >
            {bidTypeLabel[bid.type]}
          </span>
        </div>

        <h2 className="line-clamp-2 text-base font-semibold leading-snug text-ink sm:text-[1.05rem]">
          {bid.title}
        </h2>

        <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[1.65rem] font-semibold leading-none tracking-tight text-ink sm:text-[1.75rem]">
          {bid.price} ₽/кг
        </p>

        <div className="space-y-2 border-t border-[var(--gk-border)] pt-3 text-sm leading-snug">
          <p className="min-w-0">
            <span className="text-[var(--gk-fg-muted)]">Объём </span>
            <span className="font-medium text-ink">{bid.volume}</span>
          </p>
          <p className="min-w-0">
            <span className="text-[var(--gk-fg-muted)]">Регион </span>
            <span
              className="line-clamp-2 font-medium text-ink"
              title={bid.region}
            >
              {bid.region}
            </span>
          </p>
        </div>

        {bid.quality.trim() && (
          <p className="text-xs leading-relaxed text-[var(--gk-fg-muted)]">
            <span>Качество: </span>
            {bid.quality}
          </p>
        )}

        {bid.comment.trim() && (
          <p className="line-clamp-2 text-xs leading-relaxed text-[var(--gk-fg-muted)]">
            {bid.comment}
          </p>
        )}

        {hasMeta && (
          <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] uppercase tracking-wide text-[var(--gk-fg-muted)]">
            {authorName ? `Автор: ${authorName}` : ''}
            {authorName && publishedAt ? ' · ' : ''}
            {publishedAt ?? ''}
          </p>
        )}
      </div>

      <div className="border-t border-[var(--gk-border)] px-4 py-3 sm:px-5">
        <Button
          type="button"
          size="sm"
          variant="accent"
          className="h-9 w-full sm:w-auto sm:min-w-[7.5rem]"
        >
          Подробнее
        </Button>
      </div>
    </Card>
  )
}
