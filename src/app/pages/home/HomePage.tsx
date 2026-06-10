import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { MainLayout } from '@/app/layout/MainLayout'
import { getBids } from '@/shared/api/bids'
import { getContactRequests } from '@/shared/api/contacts'
import { EBidType, type TBid } from '@/shared/types'
import { cn } from '@/shared/lib'
import { BidCard } from './BidCard'
import { SendContactModal } from './SendContactModal'

/* ── types ────────────────────────────────────────────────────── */
type BidFilter = EBidType | 'all'
type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'qty_asc' | 'qty_desc'

interface Filters {
  type: BidFilter
  query: string
  region: string
  priceMin: string
  priceMax: string
  qtyMin: string
  qtyMax: string
}

const initialFilters: Filters = {
  type: 'all',
  query: '',
  region: '',
  priceMin: '',
  priceMax: '',
  qtyMin: '',
  qtyMax: '',
}

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'newest',     label: 'Сначала новые' },
  { id: 'price_asc',  label: 'По цене ↑' },
  { id: 'price_desc', label: 'По цене ↓' },
  { id: 'qty_asc',    label: 'По объёму ↑' },
  { id: 'qty_desc',   label: 'По объёму ↓' },
]

const PER_PAGE = 6

/* ── helpers ───────────────────────────────────────────────────── */
function parseNum(s: string): number {
  const n = parseFloat(s.replace(',', '.').replace(/\s/g, ''))
  return isNaN(n) ? 0 : n
}

function fmtNum(n: number): string {
  return n.toLocaleString('ru-RU')
}

function pluralBids(n: number): string {
  const r10 = n % 10
  const r100 = n % 100
  if (r10 === 1 && r100 !== 11) { return 'заявка' }
  if (r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14)) { return 'заявки' }
  return 'заявок'
}

/* ── icons ─────────────────────────────────────────────────────── */
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const ChevIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)
const CheckSmIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const XSmIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const SlidersIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
    <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
    <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
    <line x1="17" y1="16" x2="23" y2="16"/>
  </svg>
)

/* ── FilterPanel ───────────────────────────────────────────────── */
const ChevUpIcon = () => (
  <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 7 5 3 8 7"/>
  </svg>
)
const ChevDownIcon = () => (
  <svg width="7" height="7" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="2 3 5 7 8 3"/>
  </svg>
)

function RangeField({
  label, value, onChange, placeholder, suffix, error, step = 1,
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder: string; suffix: string; error: boolean; step?: number
}) {
  const inc = () => { onChange(String(Math.max(0, parseInt(value || '0', 10) + step))) }
  const dec = () => {
    const next = Math.max(0, parseInt(value || '0', 10) - step)
    onChange(next === 0 ? '' : String(next))
  }

  return (
    <div>
      <span className="mb-1 block text-[11px] uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">{label}</span>
      <div
        className={cn(
          'flex overflow-hidden rounded-[var(--gk-radius-sm)] border bg-paper transition-colors focus-within:border-green',
          error ? 'border-[var(--gk-danger)]' : 'border-[var(--gk-border-strong)]',
        )}
      >
        <input
          type="text"
          inputMode="numeric"
          className="min-w-0 flex-1 bg-transparent py-2 pl-3 font-['JetBrains_Mono',ui-monospace,monospace] text-sm text-ink placeholder:text-[var(--gk-fg-muted)] focus:outline-none"
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value.replace(/\D/g, '')) }}
        />
        <div className="flex flex-col border-l border-[var(--gk-border)]">
          <button
            type="button"
            tabIndex={-1}
            onClick={inc}
            className="flex flex-1 w-5 items-center justify-center text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.07)] hover:text-ink"
          >
            <ChevUpIcon />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={dec}
            className="flex flex-1 w-5 items-center justify-center border-t border-[var(--gk-border)] text-[var(--gk-fg-muted)] hover:bg-[rgba(14,26,20,.07)] hover:text-ink"
          >
            <ChevDownIcon />
          </button>
        </div>
        <div className="flex items-center border-l border-[var(--gk-border)] px-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-[var(--gk-fg-muted)]">
          {suffix}
        </div>
      </div>
    </div>
  )
}

function FilterPanel({
  filters, onFiltersChange, onReset, onApply, hasActive,
}: {
  filters: Filters
  onFiltersChange: (f: Filters) => void
  onReset: () => void
  onApply: () => void
  hasActive: boolean
}) {
  const set = (k: keyof Filters) => (v: string) => { onFiltersChange({ ...filters, [k]: v }) }
  const priceErr = Boolean(
    filters.priceMin && filters.priceMax &&
    parseNum(filters.priceMin) > parseNum(filters.priceMax),
  )
  const qtyErr = Boolean(
    filters.qtyMin && filters.qtyMax &&
    parseNum(filters.qtyMin) > parseNum(filters.qtyMax),
  )

  return (
    <div className="flex flex-col gap-3.5">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-0.5">
        <h2 className="text-[17px] font-semibold tracking-tight text-ink">Фильтры</h2>
        {hasActive && (
          <button
            type="button"
            className="rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep hover:bg-green-soft"
            onClick={onReset}
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Type */}
      <FilterCard title="Тип заявки">
        <div className="flex gap-0.5 rounded-[var(--gk-radius-sm)] border border-[var(--gk-border)] bg-paper p-0.5">
          {(['all', EBidType.Buy, EBidType.Sell] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={cn(
                'flex-1 rounded-[4px] py-[7px] text-[13px] font-medium transition-colors',
                filters.type === v
                  ? v === EBidType.Buy
                    ? 'bg-green font-semibold text-cream'
                    : v === EBidType.Sell
                      ? 'border border-green bg-cream font-semibold text-green-deep'
                      : 'bg-ink font-semibold text-cream'
                  : 'text-[var(--gk-fg-muted)] hover:text-ink',
              )}
              onClick={() => { onFiltersChange({ ...filters, type: v }) }}
            >
              {v === 'all' ? 'Все' : v === EBidType.Buy ? 'Покупка' : 'Продажа'}
            </button>
          ))}
        </div>
      </FilterCard>

      {/* Culture */}
      <FilterCard title="Культура">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gk-fg-muted)]">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="w-full rounded-[var(--gk-radius-sm)] border border-[var(--gk-border-strong)] bg-paper py-2 pl-9 pr-3 text-sm text-ink placeholder:text-[var(--gk-fg-muted)] focus:border-green focus:outline-none"
            placeholder="Пшеница, ячмень…"
            value={filters.query}
            onChange={(e) => { set('query')(e.target.value) }}
          />
        </div>
      </FilterCard>

      {/* Region */}
      <FilterCard title="Регион">
        <input
          type="text"
          className="w-full rounded-[var(--gk-radius-sm)] border border-[var(--gk-border-strong)] bg-paper px-3 py-2 text-sm text-ink placeholder:text-[var(--gk-fg-muted)] focus:border-green focus:outline-none"
          placeholder="Краснодарский край…"
          value={filters.region}
          onChange={(e) => { set('region')(e.target.value) }}
        />
      </FilterCard>

      {/* Price */}
      <FilterCard title="Цена, ₽/т">
        <div className="grid grid-cols-2 gap-2">
          <RangeField label="От" value={filters.priceMin} onChange={set('priceMin')} placeholder="0" suffix="₽/т" error={priceErr} step={1000} />
          <RangeField label="До" value={filters.priceMax} onChange={set('priceMax')} placeholder="∞" suffix="₽/т" error={priceErr} step={1000} />
        </div>
        {priceErr && <p className="mt-1.5 text-[12px] text-[var(--gk-danger)]">«От» должно быть меньше «до»</p>}
      </FilterCard>

      {/* Volume */}
      <FilterCard title="Объём, т">
        <div className="grid grid-cols-2 gap-2">
          <RangeField label="От" value={filters.qtyMin} onChange={set('qtyMin')} placeholder="0" suffix="т" error={qtyErr} step={10} />
          <RangeField label="До" value={filters.qtyMax} onChange={set('qtyMax')} placeholder="∞" suffix="т" error={qtyErr} step={10} />
        </div>
        {qtyErr && <p className="mt-1.5 text-[12px] text-[var(--gk-danger)]">«От» должно быть меньше «до»</p>}
      </FilterCard>

      <button
        type="button"
        className="w-full rounded-[var(--gk-radius)] bg-green px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-green-deep"
        onClick={onApply}
      >
        Применить
      </button>
    </div>
  )
}

function FilterCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream px-4 py-3.5">
      <h4 className="mb-2.5 text-[12px] font-semibold uppercase tracking-[.08em] text-[var(--gk-fg-muted)]">
        {title}
      </h4>
      {children}
    </div>
  )
}

/* ── SortDropdown ──────────────────────────────────────────────── */
function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) { return }
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => { document.removeEventListener('mousedown', handle) }
  }, [open])

  const cur = SORT_OPTIONS.find((o) => o.id === value) ?? SORT_OPTIONS[0]!

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="flex items-center gap-2.5 rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream px-3.5 py-2.5 text-sm font-medium text-ink hover:border-[var(--gk-border-strong)] hover:bg-[rgba(14,26,20,.04)]"
        onClick={() => { setOpen(!open) }}
      >
        <span className="font-normal text-[var(--gk-fg-muted)]">Сортировка:</span>
        <span>{cur.label}</span>
        <ChevIcon />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[100] min-w-[220px] rounded-[var(--gk-radius)] border border-[var(--gk-border-strong)] bg-paper p-1.5 [box-shadow:var(--gk-shadow)]">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              className={cn(
                'flex w-full items-center justify-between rounded-[var(--gk-radius-sm)] px-2.5 py-2 text-left text-sm',
                o.id === value
                  ? 'font-semibold text-green-deep'
                  : 'text-ink hover:bg-[rgba(14,26,20,.04)]',
              )}
              onClick={() => { onChange(o.id); setOpen(false) }}
            >
              <span>{o.label}</span>
              {o.id === value && <CheckSmIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── ActiveFiltersRow ──────────────────────────────────────────── */
function ActiveFiltersRow({
  filters, onFiltersChange,
}: {
  filters: Filters
  onFiltersChange: (f: Filters) => void
}) {
  const chips: { key: string; label: string; onRemove: () => void }[] = []

  if (filters.type !== 'all') {
    chips.push({
      key: 'type',
      label: filters.type === EBidType.Buy ? 'Только покупка' : 'Только продажа',
      onRemove: () => { onFiltersChange({ ...filters, type: 'all' }) },
    })
  }
  if (filters.query) {
    chips.push({ key: 'query', label: `Культура: «${filters.query}»`, onRemove: () => { onFiltersChange({ ...filters, query: '' }) } })
  }
  if (filters.region) {
    chips.push({ key: 'region', label: `Регион: ${filters.region}`, onRemove: () => { onFiltersChange({ ...filters, region: '' }) } })
  }
  if (filters.priceMin) {
    chips.push({ key: 'priceMin', label: `Цена от ${fmtNum(parseNum(filters.priceMin))} ₽`, onRemove: () => { onFiltersChange({ ...filters, priceMin: '' }) } })
  }
  if (filters.priceMax) {
    chips.push({ key: 'priceMax', label: `Цена до ${fmtNum(parseNum(filters.priceMax))} ₽`, onRemove: () => { onFiltersChange({ ...filters, priceMax: '' }) } })
  }
  if (filters.qtyMin) {
    chips.push({ key: 'qtyMin', label: `Объём от ${fmtNum(parseNum(filters.qtyMin))} т`, onRemove: () => { onFiltersChange({ ...filters, qtyMin: '' }) } })
  }
  if (filters.qtyMax) {
    chips.push({ key: 'qtyMax', label: `Объём до ${fmtNum(parseNum(filters.qtyMax))} т`, onRemove: () => { onFiltersChange({ ...filters, qtyMax: '' }) } })
  }

  if (chips.length === 0) { return null }

  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1.5 rounded-full bg-green-soft px-2.5 py-1 text-[12px] font-medium text-green-deep"
        >
          {c.label}
          <button
            type="button"
            onClick={c.onRemove}
            className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-[rgba(31,90,42,.2)]"
          >
            <XSmIcon />
          </button>
        </span>
      ))}
    </div>
  )
}

/* ── EmptyState ────────────────────────────────────────────────── */
function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream px-6 py-16 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--gk-border)] bg-paper text-[var(--gk-fg-muted)]">
        <SlidersIcon />
      </div>
      <h3 className="text-[18px] font-semibold tracking-tight text-ink">Заявок не найдено</h3>
      <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">
        Попробуйте изменить или сбросить параметры фильтра
      </p>
      <button
        type="button"
        className="mt-5 rounded-[var(--gk-radius)] border border-[var(--gk-border-strong)] bg-transparent px-4 py-2 text-sm font-semibold text-ink hover:bg-[rgba(14,26,20,.04)]"
        onClick={onReset}
      >
        Сбросить фильтры
      </button>
    </div>
  )
}

/* ── Pagination ────────────────────────────────────────────────── */
function PagBtn({
  children, onClick, disabled, active,
}: {
  children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex h-9 min-w-[36px] items-center justify-center rounded-[var(--gk-radius-sm)] border px-2.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35',
        active
          ? 'border-ink bg-ink font-semibold text-cream'
          : 'border-[var(--gk-border)] bg-transparent text-[var(--gk-graphite)] hover:border-[var(--gk-border-strong)] hover:bg-[rgba(14,26,20,.04)] hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function Pagination({
  page, setPage, total,
}: {
  page: number; setPage: (p: number) => void; total: number
}) {
  if (total <= 1) { return null }

  const pages: (number | '…')[] = []
  if (total <= 7) {
    for (let i = 1; i <= total; i++) { pages.push(i) }
  } else {
    pages.push(1)
    if (page > 3) { pages.push('…') }
    const start = Math.max(2, page - 1)
    const end = Math.min(total - 1, page + 1)
    for (let i = start; i <= end; i++) { pages.push(i) }
    if (page < total - 2) { pages.push('…') }
    pages.push(total)
  }

  return (
    <div className="mt-7 flex items-center justify-center gap-1">
      <PagBtn onClick={() => { setPage(Math.max(1, page - 1)) }} disabled={page === 1}>←</PagBtn>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1.5 text-sm text-[var(--gk-fg-muted)]">…</span>
        ) : (
          <PagBtn key={p} active={page === p} onClick={() => { setPage(p) }}>
            {p}
          </PagBtn>
        ),
      )}
      <PagBtn onClick={() => { setPage(Math.min(total, page + 1)) }} disabled={page === total}>→</PagBtn>
    </div>
  )
}

/* ── Toast ─────────────────────────────────────────────────────── */
function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-[var(--gk-radius)] bg-ink px-4 py-2.5 text-[13px] font-medium text-cream [box-shadow:var(--gk-shadow-md)]">
      {message}
    </div>
  )
}

/* ── HomePage ──────────────────────────────────────────────────── */
export function HomePage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [sort, setSort] = useState<SortKey>('newest')
  const [page, setPage] = useState(1)
  const [crModalBid, setCrModalBid] = useState<TBid | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => { setToast(null) }, 2000)
  }

  /* fetch all active bids once, filter client-side */
  const { data: allBids = [], isLoading, isError, error } = useQuery({
    queryKey: ['bids', 'feed'],
    queryFn: () => getBids({ status: 'active' }),
    staleTime: 60_000,
  })

  /* track already-sent contact requests */
  const { data: sentData } = useQuery({
    queryKey: ['contact-requests', 'outgoing'],
    queryFn: () => getContactRequests({ direction: 'outgoing' }),
    enabled: user !== null,
    staleTime: 30_000,
  })
  const sentBidIds = useMemo(() => {
    const s = new Set<number>()
    sentData?.contact_requests.forEach((cr) => { s.add(cr.bid_id) })
    return s
  }, [sentData])

  /* filtering + sorting */
  const hasActive = useMemo(() =>
    filters.type !== 'all' ||
    Boolean(filters.query) ||
    Boolean(filters.region) ||
    Boolean(filters.priceMin) ||
    Boolean(filters.priceMax) ||
    Boolean(filters.qtyMin) ||
    Boolean(filters.qtyMax),
  [filters])

  const filtered = useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    const reg = filters.region.trim().toLowerCase()
    const pMin = filters.priceMin ? parseNum(filters.priceMin) : -Infinity
    const pMax = filters.priceMax ? parseNum(filters.priceMax) : Infinity
    const vMin = filters.qtyMin ? parseNum(filters.qtyMin) : -Infinity
    const vMax = filters.qtyMax ? parseNum(filters.qtyMax) : Infinity

    let list = allBids.filter((b) => {
      if (b.author.id === user?.id) { return false }
      if (filters.type !== 'all' && b.type !== filters.type) { return false }
      if (q && !(b.title + ' ' + b.quality + ' ' + b.comment).toLowerCase().includes(q)) { return false }
      if (reg && !b.region.toLowerCase().includes(reg)) { return false }
      const price = parseNum(b.price)
      if (price < pMin || price > pMax) { return false }
      const vol = parseNum(b.volume)
      if (vol < vMin || vol > vMax) { return false }
      return true
    })

    if (sort === 'newest') {
      list = [...list].sort((a, b) => {
        if (!a.published_at && !b.published_at) { return b.id - a.id }
        if (!a.published_at) { return 1 }
        if (!b.published_at) { return -1 }
        return b.published_at.localeCompare(a.published_at)
      })
    } else if (sort === 'price_asc') {
      list = [...list].sort((a, b) => parseNum(a.price) - parseNum(b.price))
    } else if (sort === 'price_desc') {
      list = [...list].sort((a, b) => parseNum(b.price) - parseNum(a.price))
    } else if (sort === 'qty_asc') {
      list = [...list].sort((a, b) => parseNum(a.volume) - parseNum(b.volume))
    } else {
      // qty_desc
      list = [...list].sort((a, b) => parseNum(b.volume) - parseNum(a.volume))
    }

    return list
  }, [allBids, filters, sort, user?.id])

  /* pagination — clamp page without a setState-in-effect */
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const slice = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const resetFilters = () => { setFilters(initialFilters); setPage(1) }

  const handleFiltersChange = (f: Filters) => { setFilters(f); setPage(1) }

  const errorMessage = error instanceof Error ? error.message : 'Не удалось загрузить заявки.'

  /* invalidate feed after successful contact request (sent from modal) */
  const handleSent = () => {
    void queryClient.invalidateQueries({ queryKey: ['contact-requests', 'outgoing'] })
    setCrModalBid(null)
    flash('Запрос отправлен — автор получит уведомление')
  }

  return (
    <MainLayout>
      <div className="flex items-start gap-7">
        {/* Sidebar */}
        <aside className="w-[304px] shrink-0">
          <div className="sticky top-[88px]">
            <FilterPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={resetFilters}
              onApply={() => { setPage(1) }}
              hasActive={hasActive}
            />
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Feed header */}
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <h1 className="flex items-baseline gap-3.5 text-[32px] font-bold tracking-tight text-ink">
                Заявки
                {!isLoading && (
                  <span className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm font-medium text-[var(--gk-fg-muted)]">
                    {fmtNum(filtered.length)} {pluralBids(filtered.length)}
                  </span>
                )}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">
                Актуальные предложения на покупку и продажу сельхозпродукции
              </p>
            </div>
            <SortDropdown value={sort} onChange={(v) => { setSort(v); setPage(1) }} />
          </div>

          {/* Active filter chips */}
          <ActiveFiltersRow filters={filters} onFiltersChange={handleFiltersChange} />

          {/* States */}
          {isLoading && (
            <p className="text-sm text-[var(--gk-fg-muted)]">Загружаем заявки…</p>
          )}
          {isError && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}

          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState onReset={resetFilters} />
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <>
              <div className="flex flex-col gap-3">
                {slice.map((bid) => (
                  <BidCard
                    key={bid.id}
                    bid={bid}
                    alreadySent={sentBidIds.has(bid.id)}
                    onContact={(b) => { setCrModalBid(b) }}
                  />
                ))}
              </div>
              <Pagination page={safePage} setPage={setPage} total={totalPages} />
            </>
          )}
        </main>
      </div>

      {crModalBid !== null && (
        <SendContactModal
          bid={crModalBid}
          alreadySent={sentBidIds.has(crModalBid.id)}
          onClose={() => { setCrModalBid(null) }}
          onSent={handleSent}
        />
      )}

      {toast !== null && <Toast message={toast} />}
    </MainLayout>
  )
}
