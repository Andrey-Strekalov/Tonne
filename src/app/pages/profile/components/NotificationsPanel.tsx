import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/shared/api'
import type { TNotification } from '@/shared/types'
import { formatDateTime } from '../profile-utils'

type Props = {
  onClose: () => void
  onGoToContacts: (crId?: number) => void
}

export function NotificationsPanel({ onClose, onGoToContacts }: Props) {
  const queryClient = useQueryClient()

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(),
    staleTime: 10_000,
  })

  const notifications = data?.results ?? []

  const markOneMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const handleItemClick = (n: TNotification) => {
    const crId = n.contact_request_id ?? undefined
    if (n.is_read) {
      onClose()
      onGoToContacts(crId)
      return
    }
    markOneMutation.mutate(n.id, {
      onSuccess: () => {
        onClose()
        onGoToContacts(crId)
      },
    })
  }

  return (
    <div
      className="absolute right-0 top-12 z-30 w-[400px] max-w-[90vw] overflow-hidden rounded-[var(--gk-radius-lg)] border border-[var(--gk-border-strong)] bg-paper [box-shadow:var(--gk-shadow-lg)]"
      onClick={(e) => { e.stopPropagation() }}
    >
      <div className="flex items-center justify-between border-b border-[var(--gk-border)] px-5 py-4">
        <h4 className="text-[15px] font-semibold tracking-tight text-ink">Уведомления</h4>
        {notifications.some((n) => !n.is_read) && (
          <button
            className="inline-flex items-center gap-1.5 rounded-[var(--gk-radius-sm)] px-2.5 py-1.5 text-[13px] font-medium text-green-deep hover:bg-green-soft"
            onClick={() => { markAllMutation.mutate() }}
            disabled={markAllMutation.isPending}
          >
            Прочитать все
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px] text-[var(--gk-fg-muted)]">
          Уведомлений пока нет
        </div>
      ) : (
        <div className="max-h-[480px] overflow-y-auto">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={() => { handleItemClick(n) }} />
          ))}
        </div>
      )}

      <div className="border-t border-[var(--gk-border)] bg-cream px-5 py-3 text-center">
        <button
          className="text-[13px] font-medium text-green-deep hover:underline"
          onClick={() => { onClose(); onGoToContacts() }}
        >
          Все контактные заявки →
        </button>
      </div>
    </div>
  )
}

function NotificationItem({ notification: n, onClick }: { notification: TNotification; onClick: () => void }) {
  const bidTitle = n.payload?.bid_title ?? '—'
  const senderName = n.payload?.sender_first_name ?? 'Пользователь'

  return (
    <div
      className={`relative cursor-pointer border-t border-[var(--gk-border)] py-3.5 pl-9 pr-5 transition-colors first:border-t-0 hover:bg-[rgba(14,26,20,.025)] ${n.is_read ? 'bg-paper' : 'bg-green-soft hover:bg-[#cce0bd]'}`}
      onClick={onClick}
    >
      {!n.is_read && (
        <span className="absolute left-4 top-[1.1rem] h-2 w-2 rounded-full bg-green" />
      )}
      <p className={`text-[13.5px] leading-snug ${n.is_read ? 'text-[var(--gk-fg-muted)]' : 'font-semibold text-ink'}`}>
        <strong className={n.is_read ? 'text-ink' : 'text-green-deep'}>{senderName}</strong>
        {' хочет связаться по заявке «'}{bidTitle}{'»'}
      </p>
      <p className="mt-1.5 font-['JetBrains_Mono',ui-monospace,monospace] text-[11px] text-[var(--gk-fg-muted)]">
        {formatDateTime(n.created_at)}
      </p>
    </div>
  )
}
