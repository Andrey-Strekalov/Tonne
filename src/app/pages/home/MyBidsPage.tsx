import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/app/layout/MainLayout'
import { useAuth } from '@/app/providers/auth-context'
import { getBids } from '@/shared/api/bids'
import { EBidType } from '@/shared/types'
import { BidCard } from './BidCard'

type FilterType = EBidType | 'all'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: EBidType.Buy, label: 'Покупка' },
  { value: EBidType.Sell, label: 'Продажа' },
]

export function MyBidsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')

  const { data: filtered = [], isLoading, isError } = useQuery({
    queryKey: ['bids', 'my', user?.id, filter],
    queryFn: () => getBids({ author_id: user!.id, ...(filter !== 'all' && { type: filter }) }),
    enabled: user !== null,
  })

  return (
    <MainLayout>
      <section className="space-y-3 rounded-[var(--gk-radius-lg)] bg-cream px-4 py-5 [box-shadow:var(--gk-shadow-sm)] sm:px-6">
        <h1 className="text-xl font-semibold text-ink sm:text-2xl">
          Мои заявки
        </h1>
        <div className="flex gap-2">
          {FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { setFilter(value); }}
              className={[
                'rounded-[var(--gk-radius-sm)] border px-4 py-1.5 text-sm font-semibold transition-colors',
                filter === value
                  ? 'border-green bg-green text-cream'
                  : 'border-[var(--gk-border-strong)] bg-paper text-[var(--gk-fg-muted)] hover:text-ink hover:border-ink',
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
        {isLoading && (
          <div className="col-span-full py-12 text-center text-sm text-[var(--gk-fg-muted)]">
            Загрузка…
          </div>
        )}
        {isError && (
          <div className="col-span-full py-12 text-center text-sm text-red-500">
            Не удалось загрузить заявки.
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="col-span-full rounded-[var(--gk-radius-lg)] border border-dashed border-[var(--gk-border-strong)] bg-cream/60 px-4 py-12 text-center sm:px-6">
            <p className="text-sm font-semibold text-ink">
              Пока нет заявок
            </p>
            <p className="mt-2 text-sm text-[var(--gk-fg-muted)]">
              Нажмите «Разместить заявку», чтобы добавить первую.
            </p>
          </div>
        )}
        {!isLoading && !isError && filtered.map((bid) => (
          <BidCard key={bid.id} bid={bid} alreadySent={false} onContact={() => {}} hideContact />
        ))}
      </section>
    </MainLayout>
  )
}
