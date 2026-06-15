import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { getBids, archiveBid, unarchiveBid, deleteBid, updateBid } from '@/shared/api/bids'
import { EBidType, type TBid, type TCreateBidRequest } from '@/shared/types'
import { Button, Input, Label, Textarea } from '@/shared/ui/kit'
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
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

type BidFilter = 'all' | EBidType | 'archived'
const TABS: { value: BidFilter; label: string; muted?: boolean }[] = [
  { value: 'all', label: 'Все' },
  { value: EBidType.Buy, label: 'Покупка' },
  { value: EBidType.Sell, label: 'Продажа' },
  { value: 'archived', label: 'Архивные', muted: true },
]
const PAGE_SIZE = 5

function filterBids(bids: TBid[], filter: BidFilter): TBid[] {
  if (filter === 'archived') { return bids.filter((b) => b.is_archived) }
  if (filter === 'all') { return [...bids] }
  return bids.filter((b) => !b.is_archived && b.type === filter)
}

export function AdsSection() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<BidFilter>('all')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [editBid, setEditBid] = useState<TBid | null>(null)
  const [deletePending, setDeletePending] = useState<{ id: number; title: string } | null>(null)

  const { data: allBids = [], isLoading } = useQuery({
    queryKey: ['bids', 'my-all', user?.id],
    queryFn: () => getBids({ author_id: user!.id, status: 'all', page_size: 100 }),
    enabled: user !== null,
  })

  const filtered = filterBids(allBids, filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const counts: Record<BidFilter, number> = {
    all: allBids.length,
    [EBidType.Buy]: allBids.filter((b) => !b.is_archived && b.type === EBidType.Buy).length,
    [EBidType.Sell]: allBids.filter((b) => !b.is_archived && b.type === EBidType.Sell).length,
    archived: allBids.filter((b) => b.is_archived).length,
  }

  const activeCount = counts[EBidType.Buy] + counts[EBidType.Sell]

  const invalidate = () => { void queryClient.invalidateQueries({ queryKey: ['bids'] }) }

  const userId = user?.id
  const myBidsKey = ['bids', 'my-all', userId] as const

  const archiveMut = useMutation({
    mutationFn: (id: number) => archiveBid(id),
    onMutate: async (bidId) => {
      await queryClient.cancelQueries({ queryKey: myBidsKey })
      const previous = queryClient.getQueryData<TBid[]>(myBidsKey)
      queryClient.setQueryData<TBid[]>(myBidsKey, (old) =>
        (old ?? []).map((b) => b.id === bidId ? { ...b, is_archived: true } : b)
      )
      return { previous }
    },
    onError: (_err, _bidId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(myBidsKey, context.previous)
      }
    },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: myBidsKey }) },
  })

  const unarchiveMut = useMutation({
    mutationFn: (id: number) => unarchiveBid(id),
    onMutate: async (bidId) => {
      await queryClient.cancelQueries({ queryKey: myBidsKey })
      const previous = queryClient.getQueryData<TBid[]>(myBidsKey)
      queryClient.setQueryData<TBid[]>(myBidsKey, (old) =>
        (old ?? []).map((b) => b.id === bidId ? { ...b, is_archived: false } : b)
      )
      return { previous }
    },
    onError: (_err, _bidId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(myBidsKey, context.previous)
      }
    },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: myBidsKey }) },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteBid(id),
    onMutate: async (bidId) => {
      await queryClient.cancelQueries({ queryKey: myBidsKey })
      const previous = queryClient.getQueryData<TBid[]>(myBidsKey)
      queryClient.setQueryData<TBid[]>(myBidsKey, (old) =>
        (old ?? []).filter((b) => b.id !== bidId)
      )
      setDeletePending(null)
      return { previous }
    },
    onError: (_err, _bidId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(myBidsKey, context.previous)
      }
    },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: myBidsKey }) },
  })

  const handleFilterChange = (f: BidFilter) => { setFilter(f); setPage(1) }

  return (
    <>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-ink">Объявления</h1>
            {activeCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-[rgba(14,26,20,.06)] px-2.5 py-1 text-[13px] font-medium text-[var(--gk-fg-muted)]">
                {activeCount}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">Ваши заявки на покупку и продажу сельхозпродукции</p>
        </div>
        <Button variant="default" size="sm" onClick={() => { setCreateOpen(true) }}>
          <PlusIcon /> Создать объявление
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="inline-flex gap-0.5 rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream p-1">
          {TABS.map(({ value, label, muted }) => {
            const isActive = filter === value
            return (
              <button
                key={value}
                onClick={() => { handleFilterChange(value) }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-[6px] px-3.5 py-[7px] text-[13px] font-medium transition-colors',
                  isActive
                    ? muted
                      ? 'bg-[rgba(14,26,20,.06)] font-semibold text-[var(--gk-fg-muted)]'
                      : 'bg-paper font-semibold text-ink [box-shadow:0_1px_2px_rgba(14,26,20,.06)]'
                    : 'text-graphite hover:text-ink',
                )}
              >
                {label}
                <span className={cn(
                  'rounded-full px-1.5 py-px text-[11px] font-medium',
                  isActive
                    ? muted
                      ? 'bg-[rgba(14,26,20,.10)] text-[var(--gk-fg-muted)]'
                      : 'bg-green-soft text-green-deep'
                    : 'bg-[rgba(14,26,20,.06)] text-[var(--gk-fg-muted)]',
                )}>
                  {counts[value]}
                </span>
              </button>
            )
          })}
        </div>
        <span className="text-[13px] text-[var(--gk-fg-muted)]">
          Сортировка: <strong className="font-semibold text-ink">по дате (новые сверху)</strong>
        </span>
      </div>

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
            onEdit={() => { setEditBid(bid) }}
            onArchive={() => { archiveMut.mutate(bid.id) }}
            onUnarchive={() => { unarchiveMut.mutate(bid.id) }}
            onDelete={() => { setDeletePending({ id: bid.id, title: bid.title }) }}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      <CreateBid open={createOpen} onClose={() => { setCreateOpen(false) }} />

      {editBid !== null && (
        <EditBidModal
          bid={editBid}
          onClose={() => { setEditBid(null) }}
          onSuccess={() => { invalidate(); setEditBid(null) }}
        />
      )}

      {deletePending !== null && (
        <DeleteBidModal
          title={deletePending.title}
          isPending={deleteMut.isPending}
          onClose={() => { setDeletePending(null) }}
          onConfirm={() => { deleteMut.mutate(deletePending.id) }}
        />
      )}
    </>
  )
}

function AdCard({ bid, onEdit, onArchive, onUnarchive, onDelete }: {
  bid: TBid
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}) {
  const isBuy = bid.type === EBidType.Buy
  const dateStr = bid.published_at ? formatDate(bid.published_at) : '—'
  const bidCode = `TN-${bid.id}`

  return (
    <div className={cn(
      'rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream px-[22px] pt-[18px] pb-0 transition-[border-color,opacity] hover:border-[var(--gk-border-strong)]',
      bid.is_archived && 'opacity-[0.65] hover:opacity-[0.85]',
    )}>
      <div className="grid grid-cols-[92px_1fr_auto] gap-[22px] pb-[18px]">
        {/* Badges col */}
        <div className="flex flex-col items-start gap-1.5">
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-[5px] text-[12px] font-semibold leading-none',
            isBuy
              ? 'bg-green text-cream'
              : 'bg-cream text-green-deep [box-shadow:inset_0_0_0_1px_var(--gk-green)]',
          )}>
            {isBuy ? 'Покупка' : 'Продажа'}
          </span>
          {bid.is_archived && (
            <span className="inline-flex items-center rounded-full border border-[var(--gk-border)] bg-[rgba(14,26,20,.06)] px-2.5 py-[5px] text-[12px] font-medium leading-none text-[var(--gk-fg-muted)]">
              Архив
            </span>
          )}
        </div>

        {/* Info col */}
        <div>
          <p className={cn(
            'text-base font-semibold tracking-tight',
            bid.is_archived ? 'text-[var(--gk-fg-muted)]' : 'text-ink',
          )}>
            {bid.title}
          </p>
          {(bid.quality || bid.region) && (
            <p className="mt-0.5 text-[12px] text-[var(--gk-fg-muted)]">
              {[bid.quality.trim(), bid.region].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3.5 text-[12px] text-[var(--gk-fg-muted)]">
            <span className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${bid.is_archived ? 'bg-[var(--gk-fg-muted)]' : 'bg-green-light'}`} />
              {bid.is_archived ? 'Архивировано' : 'Активна'}
            </span>
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px]">{bidCode}</span>
            <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-[11px]">{dateStr}</span>
          </div>
        </div>

        {/* Price col */}
        <div className="text-right">
          <p className={cn(
            "font-['JetBrains_Mono',ui-monospace,monospace] text-[17px] font-semibold",
            bid.is_archived ? 'text-[var(--gk-fg-muted)]' : 'text-ink',
          )}>
            {Number(bid.price).toLocaleString('ru-RU')} ₽
          </p>
          <p className="text-[11px] text-[var(--gk-fg-muted)]">за тонну</p>
          <p className="mt-2 text-[13px] text-[var(--gk-fg-muted)]">
            Объём: <b className="font-['JetBrains_Mono',ui-monospace,monospace] font-medium text-ink">{Number(bid.volume).toLocaleString('ru-RU')}</b> т
          </p>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center justify-end gap-2.5 border-t border-[var(--gk-border)] py-3">
        {bid.is_archived ? (
          <>
            <button
              className="rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] text-[var(--gk-fg-muted)] transition-colors hover:text-[var(--gk-danger)]"
              onClick={onDelete}
            >
              <u className="decoration-[1px] underline-offset-[3px]">Удалить</u>
            </button>
            <button
              className="rounded-[var(--gk-radius-sm)] border border-[var(--gk-border-strong)] bg-transparent px-3 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-[rgba(14,26,20,.04)]"
              onClick={onUnarchive}
            >
              Разархивировать
            </button>
          </>
        ) : (
          <>
            <button
              className="inline-flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep transition-colors hover:bg-green-soft"
              onClick={onEdit}
            >
              <PencilIcon /> Редактировать
            </button>
            <button
              className="inline-flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep transition-colors hover:bg-green-soft"
              onClick={onArchive}
            >
              Архивировать
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function EditBidModal({ bid, onClose, onSuccess }: { bid: TBid; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    type: bid.type,
    title: bid.title,
    price: bid.price,
    volume: bid.volume,
    region: bid.region,
    quality: bid.quality,
    comment: bid.comment,
  })
  const [error, setError] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Partial<TCreateBidRequest>) => updateBid(bid.id, data),
    onSuccess,
    onError: (err: Error) => { setError(err.message) },
  })

  const handleChange = (field: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const q = form.quality.trim()
    const c = form.comment.trim()
    const payload: Partial<TCreateBidRequest> = {
      type: form.type,
      title: form.title.trim(),
      price: form.price.trim(),
      volume: form.volume.trim(),
      region: form.region.trim(),
      ...(q && { quality: q }),
      ...(c && { comment: c }),
    }
    mutate(payload)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-[rgba(14,26,20,.5)] backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className="w-full max-w-[560px] rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-[var(--gk-paper)] [box-shadow:var(--gk-shadow-lg)]">
        <div className="flex items-start justify-between gap-3 px-7 pt-6 pb-2">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight text-ink">Редактировать заявку</h2>
            <p className="mt-1 text-[13px] text-[var(--gk-fg-muted)]">Измените параметры и сохраните</p>
          </div>
          <button
            type="button"
            className="rounded-[var(--gk-radius-sm)] p-1.5 text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.05)] hover:text-ink"
            onClick={onClose}
          >
            <XIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-7 py-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-ink">Тип заявки</Label>
              <div className="flex gap-2">
                {([EBidType.Sell, EBidType.Buy] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setForm((prev) => ({ ...prev, type: t })) }}
                    className={cn(
                      'rounded-[var(--gk-radius-sm)] border px-4 py-2 text-sm font-semibold transition-colors',
                      form.type === t
                        ? 'border-green bg-green-soft text-green-deep'
                        : 'border-[var(--gk-border-strong)] text-[var(--gk-fg-muted)] hover:text-ink',
                    )}
                  >
                    {t === EBidType.Sell ? 'Продажа' : 'Покупка'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eb-title" className="text-ink">Название культуры</Label>
              <Input id="eb-title" value={form.title} onChange={handleChange('title')} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eb-price" className="text-ink">Цена за тонну, ₽</Label>
                <Input
                  id="eb-price"
                  value={form.price}
                  onChange={handleChange('price')}
                  required
                  className="font-['JetBrains_Mono',ui-monospace,monospace]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eb-volume" className="text-ink">Объём, т</Label>
                <Input
                  id="eb-volume"
                  value={form.volume}
                  onChange={handleChange('volume')}
                  required
                  className="font-['JetBrains_Mono',ui-monospace,monospace]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eb-region" className="text-ink">Регион</Label>
              <Input id="eb-region" value={form.region} onChange={handleChange('region')} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eb-quality" className="text-ink">Качество</Label>
              <Input id="eb-quality" value={form.quality} onChange={handleChange('quality')} placeholder="Протеин 12.5%, ГОСТ…" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eb-comment" className="text-ink">Комментарий</Label>
              <Textarea id="eb-comment" value={form.comment} onChange={handleChange('comment')} rows={3} placeholder="Дополнительные условия…" />
            </div>

            {error !== null && <p className="text-sm text-[var(--gk-danger)]">{error}</p>}
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

function DeleteBidModal({ title, isPending, onClose, onConfirm }: {
  title: string
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-[rgba(14,26,20,.5)] backdrop-blur-[3px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) { onClose() } }}
    >
      <div className="w-full max-w-[400px] rounded-[var(--gk-radius-xl)] border border-[var(--gk-border-strong)] bg-[var(--gk-paper)] [box-shadow:var(--gk-shadow-lg)]">
        <div className="p-7 pb-5">
          <h2 className="text-[20px] font-bold tracking-tight text-ink">Удалить заявку?</h2>
          <p className="mt-2 text-sm text-[var(--gk-fg-muted)]">
            Заявка <strong className="font-semibold text-ink">«{title}»</strong> будет удалена безвозвратно.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--gk-border)] px-7 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>Отмена</Button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="inline-flex items-center justify-center rounded-[var(--gk-radius)] bg-[var(--gk-danger)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8a2d24] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isPending ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) { pages.push(i) }
  } else {
    pages.push(1)
    if (page > 3) { pages.push('…') }
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) { pages.push(i) }
    if (page < totalPages - 2) { pages.push('…') }
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
