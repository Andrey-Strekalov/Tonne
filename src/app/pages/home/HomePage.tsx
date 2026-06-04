import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/app/layout/MainLayout'
import { getBids } from '@/shared/api/bids'
import { EBidType } from '@/shared/types'
import { cn } from '@/shared/lib'
import { BidCard } from './BidCard'

type BidFilter = EBidType | 'all'

const FILTER_OPTIONS: { label: string; value: BidFilter }[] = [
  { label: 'Все', value: 'all' },
  { label: 'Покупка', value: EBidType.Buy },
  { label: 'Продажа', value: EBidType.Sell },
]

export function HomePage() {
  const [filter, setFilter] = useState<BidFilter>('all')

  const { data: bids = [], isLoading, isError, error } = useQuery({
    queryKey: ['bids', filter],
    queryFn: () => getBids(filter === 'all' ? undefined : { type: filter }),
  })
  const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить заявки.'

  return (
    <MainLayout>
      <section className="space-y-3 rounded-[var(--gk-radius-lg)] bg-cream px-4 py-5 [box-shadow:var(--gk-shadow-sm)] sm:px-6">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">
          Заявки на покупку и продажу зерна
        </h1>
        <p className="max-w-2xl text-sm text-[var(--gk-fg-muted)]">
          Актуальные предложения от продавцов и покупателей: культура, цена,
          объём и адрес в одной карточке.
        </p>

        <div className="flex gap-2 pt-1">
          {FILTER_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setFilter(value) }}
              className={cn(
                'rounded-[var(--gk-radius-sm)] border px-4 py-1.5 text-sm font-semibold transition-colors',
                filter === value
                  ? 'border-green bg-green text-cream'
                  : 'border-[var(--gk-border-strong)] bg-paper text-[var(--gk-fg-muted)] hover:text-ink hover:border-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section
        id="listings"
        className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
      >
        {isLoading && (
          <p className="text-sm text-[var(--gk-fg-muted)]">Загружаем список заявок...</p>
        )}

        {isError && (
          <p className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {!isLoading && !isError && bids.length === 0 && (
          <p className="text-sm text-[var(--gk-fg-muted)]">Пока нет активных заявок.</p>
        )}

        {bids.map((bid) => (
          <BidCard key={bid.id} bid={bid} />
        ))}
      </section>
    </MainLayout>
  )
}
