import { useState, useMemo } from 'react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers/auth-context'
import { getContactRequests, markContactRequestRead } from '@/shared/api/contacts'
import { getBids, getBidById } from '@/shared/api/bids'
import { EBidType, type TBid, type TContactRequest } from '@/shared/types'
import { cn } from '@/shared/lib'
import { ContactRequestModal } from '../components/ContactRequestModal'
import { formatDateTime } from '../profile-utils'

const ChevRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

type Direction = 'incoming' | 'outgoing'
type ReadFilter = 'all' | 'unread' | 'read'

export function ContactsSection() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Direction>('incoming')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')
  const [selected, setSelected] = useState<{ cr: TContactRequest; bid: TBid | null; direction: Direction } | null>(null)

  const { data: incomingData } = useQuery({
    queryKey: ['contact-requests', 'incoming'],
    queryFn: () => getContactRequests({ direction: 'incoming' }),
    enabled: user !== null,
  })
  const { data: outgoingData } = useQuery({
    queryKey: ['contact-requests', 'outgoing'],
    queryFn: () => getContactRequests({ direction: 'outgoing' }),
    enabled: user !== null,
  })

  // For incoming contacts, look up bid titles from user's own bids
  const { data: myBids = [] } = useQuery({
    queryKey: ['bids', 'profile-all', user?.id],
    queryFn: () => getBids({ author_id: user!.id, status: 'all', page_size: 100 }),
    enabled: user !== null,
  })
  const myBidMap = useMemo(() => {
    const m = new Map<number, TBid>()
    myBids.forEach((b) => { m.set(b.id, b) })
    return m
  }, [myBids])

  // For outgoing contacts, fetch each referenced bid individually
  const outgoing = useMemo(() => outgoingData?.contact_requests ?? [], [outgoingData])
  const outgoingBidIds = useMemo(() => [...new Set(outgoing.map((cr) => cr.bid_id))], [outgoing])
  const outgoingBidQueries = useQueries({
    queries: outgoingBidIds.map((bidId) => ({
      queryKey: ['bid', bidId],
      queryFn: () => getBidById(bidId),
      staleTime: 5 * 60 * 1000,
    })),
  })
  const outgoingBidMap = useMemo(() => {
    const m = new Map<number, TBid>()
    outgoingBidQueries.forEach((q, i) => {
      const bidId = outgoingBidIds[i]
      if (q.data && bidId !== undefined) {m.set(bidId, q.data)}
    })
    return m
  }, [outgoingBidQueries, outgoingBidIds])

  const incoming = incomingData?.contact_requests ?? []
  const currentList = tab === 'incoming' ? incoming : outgoing
  const bidMap = tab === 'incoming' ? myBidMap : outgoingBidMap

  const filtered = currentList.filter((cr) => {
    if (readFilter === 'unread') {return !cr.is_read}
    if (readFilter === 'read') {return cr.is_read}
    return true
  })

  const unreadIncoming = incoming.filter((cr) => !cr.is_read).length

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markContactRequestRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['contact-requests'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const openRequest = (cr: TContactRequest) => {
    const bid = bidMap.get(cr.bid_id) ?? null
    setSelected({ cr, bid, direction: tab })
    if (!cr.is_read && tab === 'incoming') {
      markReadMutation.mutate(cr.id)
    }
  }

  const markAllRead = () => {
    incoming
      .filter((cr) => !cr.is_read)
      .forEach((cr) => { markReadMutation.mutate(cr.id) })
  }

  const counts = {
    all: currentList.length,
    unread: currentList.filter((cr) => !cr.is_read).length,
    read: currentList.filter((cr) => cr.is_read).length,
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-ink">Контактные заявки</h1>
        <p className="mt-1.5 text-sm text-[var(--gk-fg-muted)]">Запросы на связь по объявлениям</p>
      </div>

      {/* Subtabs */}
      <div className="flex gap-0 border-b border-[var(--gk-border)]">
        {(['incoming', 'outgoing'] as Direction[]).map((d) => (
          <button
            key={d}
            onClick={() => { setTab(d); setReadFilter('all') }}
            className={cn(
              'relative inline-flex items-center gap-2 px-5 py-3.5 text-[14px] font-medium transition-colors hover:text-ink',
              tab === d ? 'font-semibold text-ink' : 'text-[var(--gk-fg-muted)]',
            )}
          >
            {d === 'incoming' ? 'Входящие' : 'Исходящие'}
            {d === 'incoming' && unreadIncoming > 0 && (
              <span className={cn(
                'rounded-full px-1.5 py-px text-[11px] font-medium',
                tab === 'incoming' ? 'bg-green-soft text-green-deep' : 'bg-[rgba(14,26,20,.06)] text-[var(--gk-fg-muted)]',
              )}>
                {unreadIncoming}
              </span>
            )}
            {tab === d && (
              <span className="absolute bottom-[-1px] left-5 right-5 h-[2px] rounded-full bg-green" />
            )}
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="my-4 flex items-center justify-between gap-4">
        <div className="inline-flex gap-0.5 rounded-[var(--gk-radius)] border border-[var(--gk-border)] bg-cream p-1">
          {(['all', 'unread', 'read'] as ReadFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setReadFilter(f) }}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[6px] px-3 py-[7px] text-[13px] font-medium transition-colors',
                readFilter === f ? 'bg-paper font-semibold text-ink [box-shadow:0_1px_2px_rgba(14,26,20,.06)]' : 'text-graphite hover:text-ink',
              )}
            >
              {f === 'all' ? 'Все' : f === 'unread' ? 'Непрочитанные' : 'Прочитанные'}
              <span className={cn(
                'rounded-full px-1.5 py-px text-[11px]',
                readFilter === f ? 'bg-green-soft text-green-deep' : 'bg-[rgba(14,26,20,.06)] text-[var(--gk-fg-muted)]',
              )}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>
        {tab === 'incoming' && counts.unread > 0 && (
          <button
            className="inline-flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep hover:bg-green-soft"
            onClick={markAllRead}
          >
            <CheckIcon /> Отметить все прочитанными
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream py-16 text-center text-sm text-[var(--gk-fg-muted)]">
          Заявок не найдено
        </div>
      ) : (
        <div className="overflow-hidden rounded-[var(--gk-radius-lg)] border border-[var(--gk-border)] bg-cream">
          {filtered.map((cr) => {
            const bid = bidMap.get(cr.bid_id)
            return (
              <ContactRow
                key={cr.id}
                cr={cr}
                bid={bid}
                direction={tab}
                onClick={() => { openRequest(cr) }}
              />
            )
          })}
        </div>
      )}

      {selected && (
        <ContactRequestModal
          contactRequest={selected.cr}
          bid={selected.bid}
          direction={selected.direction}
          onClose={() => { setSelected(null) }}
        />
      )}
    </>
  )
}

function ContactRow({ cr, bid, direction, onClick }: {
  cr: TContactRequest
  bid: TBid | undefined
  direction: Direction
  onClick: () => void
}) {
  const bidLabel = bid
    ? `${bid.type === EBidType.Buy ? 'Покупка' : 'Продажа'}: ${bid.title}, ${Number(bid.volume).toLocaleString('ru-RU')} т`
    : `Заявка #${cr.bid_id}`

  return (
    <div
      className={cn(
        'grid cursor-pointer grid-cols-[20px_1.2fr_1.6fr_130px_22px] items-center gap-4 border-t border-[var(--gk-border)] px-5 py-4 transition-colors first:border-t-0',
        cr.is_read ? 'bg-cream hover:bg-[rgba(14,26,20,.025)]' : 'bg-green-soft hover:bg-[#cce0bd]',
      )}
      onClick={onClick}
    >
      <span className={`h-2 w-2 rounded-full justify-self-center ${cr.is_read ? 'bg-transparent' : 'bg-green'}`} />

      <div>
        <p className={`text-sm ${cr.is_read ? 'font-semibold text-ink' : 'font-bold text-ink'}`}>
          {cr.sender_organization_snapshot || `Пользователь #${cr.sender_id}`}
        </p>
        <p className="mt-0.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[12px] text-[var(--gk-fg-muted)]">
          {cr.sender_phone_snapshot}
        </p>
      </div>

      <div>
        <span className="mb-0.5 block text-[11px] font-medium uppercase tracking-[.06em] text-[var(--gk-fg-muted)]">
          {direction === 'incoming' ? 'По вашему объявлению' : 'По объявлению контрагента'}
        </span>
        <span className={`text-[13px] ${cr.is_read ? 'text-graphite' : 'text-ink'}`}>{bidLabel}</span>
      </div>

      <div className={`font-['JetBrains_Mono',ui-monospace,monospace] text-right text-[12px] ${cr.is_read ? 'text-[var(--gk-fg-muted)]' : 'text-green-deep'}`}>
        {formatDateTime(cr.created_at)}
      </div>

      <span className="text-[var(--gk-fg-muted)]"><ChevRightIcon /></span>
    </div>
  )
}
