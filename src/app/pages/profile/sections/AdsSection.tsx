import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { getBids, archiveBid, unarchiveBid, deleteBid } from '@/shared/api/bids'
import { EBidType, type TBid } from '@/shared/types'
import { Button } from '@/shared/ui/kit'
import { cn } from '@/shared/lib'
import { CreateBid } from '@/app/pages/home/CreateBid'
import { formatDate } from '../profile-utils'

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
)

type BidFilter = 'all' | EBidType | 'archived'
const TABS: { value: BidFilter; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: EBidType.Buy, label: 'Покупка' },
  { value: EBidType.Sell, label: 'Продажа' },
  { value: 'archived', label: 'Архивные' },
]
const PAGE_SIZE = 5

function filterBids(bids: TBid[], filter: BidFilter): TBid[] {
  if (filter === 'archived') {return bids.filter((b) => b.is_archived)}
  if (filter === 'all') {return bids.filter((b) => !b.is_archived)}
  return bids.filter((b) => !b.is_archived && b.type === filter)
}

export function AdsSection() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<BidFilter>('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: allBids = [], isLoading } = useQuery({
    queryKey: ['bids', 'my-all', user?.id],
    queryFn: () => getBids({ author_id: user!.id, status: 'all', page_size: 100 }),
    enabled: user !== null,
  })

  const filtered = filterBids(allBids, filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts: Record<BidFilter, number> = {
    all: allBids.filter((b) => !b.is_archived).length,
    [EBidType.Buy]: allBids.filter((b) => !b.is_archived && b.type === EBidType.Buy).length,
    [EBidType.Sell]: allBids.filter((b) => !b.is_archived && b.type === EBidType.Sell).length,
    archived: allBids.filter((b) => b.is_archived).length,
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['bids'] })

  const archiveMut = useMutation({ mutationFn: (id: number) => archiveBid(id), onSuccess: invalidate })
  const unarchiveMut = useMutation({ mutationFn: (id: number) => unarchiveBid(id), onSuccess: invalidate })
  const deleteMut = useMutation({ mutationFn: (id: number) => deleteBid(id), onSuccess: invalidate })

  const handleFilterChange = (f: BidFilter) => { setFilter(f); setPage(1) }

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Объявления</h1>
          <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">Ваши заявки на покупку и продажу сельхозпродукции</p>
        </div>
        <Button variant="default" size="sm" onClick={() => { setCreateOpen(true) }}>
          <PlusIcon /> Создать объявление
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="inline-flex gap-0.5 rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream p-1">
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => { handleFilterChange(value) }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-[7px] text-[13px] font-medium transition-colors',
                filter === value
                  ? 'bg-paper font-semibold text-ink [box-shadow:0_1px_2px_rgba(14,26,20,.06)]'
                  : 'text-graphite hover:text-ink',
              )}
            >
              {label}
              <span className={cn(
                'rounded-full px-1.5 py-px text-[11px] font-medium',
                filter === value ? 'bg-green-soft text-green-deep' : 'bg-[rgba(14,26,20,.06)] text-[var(--gk-fg-muted)]',
              )}>
                {counts[value]}
              </span>
            </button>
          ))}
        </div>
        <span className="text-[13px] text-[var(--gk-fg-muted)]">
          Сортировка: <strong className="font-semibold text-ink">по дате</strong>
        </span>
      </div>

      {/* List */}
      {isLoading && <p className="text-sm text-[var(--gk-fg-muted)]">Загрузка...</p>}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-[var(--gk-radius-lg)] border border-dashed border-[var(--gk-border-strong)] bg-cream/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-ink">Нет объявлений</p>
          <p className="mt-2 text-sm text-[var(--gk-fg-muted)]">
            {filter === 'archived' ? 'У вас нет архивных заявок.' : 'Нажмите «Создать объявление», чтобы добавить первую.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {slice.map((bid) => (
          <AdCard
            key={bid.id}
            bid={bid}
            onArchive={() => { archiveMut.mutate(bid.id) }}
            onUnarchive={() => { unarchiveMut.mutate(bid.id) }}
            onDelete={() => {
              if (window.confirm(`Удалить заявку «${bid.title}»?`)) {
                deleteMut.mutate(bid.id)
              }
            }}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <CreateBid open={createOpen} onClose={() => { setCreateOpen(false) }} />
    </>
  )
}

function AdCard({ bid, onArchive, onUnarchive, onDelete }: {
  bid: TBid
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}) {
  const typeLabel = bid.type === EBidType.Buy ? 'Покупка' : 'Продажа'
  const typeBadgeClass = bid.type === EBidType.Buy
    ? 'bg-green text-cream'
    : 'bg-cream text-green-deep [box-shadow:inset_0_0_0_1px_var(--gk-green)]'

  const dateStr = bid.published_at ? formatDate(bid.published_at) : '—'

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-5 rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream px-5 py-4 transition-colors hover:border-[var(--gk-border-strong)]">
      {/* Badge col */}
      <div className="flex flex-col items-start gap-2">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ${typeBadgeClass}`}>
          {typeLabel}
        </span>
        {bid.is_archived && (
          <span className="inline-flex items-center rounded-full border border-[var(--gk-border)] bg-[rgba(14,26,20,.04)] px-2.5 py-1 text-[12px] font-medium text-[var(--gk-fg-muted)]">
            Архив
          </span>
        )}
      </div>

      {/* Info */}
      <div>
        <p className="text-base font-semibold tracking-tight text-ink">{bid.title}</p>
        <p className="mt-0.5 text-[12px] text-[var(--gk-fg-muted)]">
          {[bid.quality, bid.region].filter(Boolean).join(' · ')}
        </p>
        <div className="mt-2 flex items-center gap-3.5 text-[12px] text-[var(--gk-fg-muted)]">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${bid.is_archived ? 'bg-[var(--gk-fg-muted)]' : 'bg-green-light'}`} />
            {bid.is_archived ? 'Архивировано' : 'Активна'}
          </span>
          <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px]">{dateStr}</span>
        </div>
      </div>

      {/* Price + actions */}
      <div className="flex flex-col items-end gap-3">
        <div className="text-right">
          <p className="font-['JetBrains_Mono',ui-monospace,monospace] text-[17px] font-semibold text-ink">
            {Number(bid.price).toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-[11px] text-[var(--gk-fg-muted)]">за тонну</p>
          <p className="mt-2 text-[13px] text-[var(--gk-fg-muted)]">
            Объём: <span className="font-['JetBrains_Mono',ui-monospace,monospace] font-medium text-ink">{Number(bid.volume).toLocaleString('ru-RU')}</span> т
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bid.is_archived ? (
            <>
              <button
                className="rounded-[var(--gk-radius-sm)] border border-[var(--gk-border-strong)] px-3 py-1.5 text-[13px] font-medium text-[var(--gk-fg-muted)] transition-colors hover:bg-[rgba(14,26,20,.04)] hover:text-ink"
                onClick={onUnarchive}
              >
                Разархивировать
              </button>
              <button
                className="px-2 py-1.5 text-[13px] text-[var(--gk-fg-muted)] underline decoration-1 underline-offset-2 hover:text-red-600"
                onClick={onDelete}
              >
                Удалить
              </button>
            </>
          ) : (
            <>
              <button className="inline-flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep hover:bg-green-soft">
                <PencilIcon /> Редактировать
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep hover:bg-green-soft"
                onClick={onArchive}
              >
                Архивировать
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {pages.push(i)}
  } else {
    pages.push(1)
    if (page > 3) {pages.push('…')}
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {pages.push(i)}
    if (page < totalPages - 2) {pages.push('…')}
    pages.push(totalPages)
  }
  return (
    <div className="mt-7 flex items-center justify-center gap-1">
      <PagBtn disabled={page === 1} onClick={() => { onPageChange(Math.max(1, page - 1)) }}>←</PagBtn>
      {pages.map((p, i) =>
        p === '…'
          ? <span key={`e${i}`} className="px-1.5 text-[var(--gk-fg-muted)]">…</span>
          : <PagBtn key={p} active={page === p} onClick={() => { onPageChange(p) }}>{p}</PagBtn>
      )}
      <PagBtn disabled={page === totalPages} onClick={() => { onPageChange(Math.min(totalPages, page + 1)) }}>→</PagBtn>
    </div>
  )
}

function PagBtn({ children, active, disabled, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-9 min-w-9 items-center justify-center rounded-[var(--gk-radius-sm)] border px-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-ink bg-ink font-semibold text-cream'
          : 'border-[var(--gk-border)] text-graphite hover:border-[var(--gk-border-strong)] hover:text-ink disabled:opacity-35',
      )}
    >
      {children}
    </button>
  )
}
