import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { wsBaseUrl } from '@/shared/config'
import { getAccessToken, getRefreshToken, setTokens } from '@/shared/lib/auth'
import { requestRefreshTokens } from '@/shared/api/auth-refresh'

const WS_PATH = '/ws/notifications/'
const CLOSE_AUTH = 4001
const BACKOFF_INITIAL = 1_000
const BACKOFF_MAX = 30_000

export function useNotificationsWS(enabled: boolean): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) { return }

    let active = true
    let ws: WebSocket | null = null
    let timer: ReturnType<typeof setTimeout> | null = null
    let backoff = BACKOFF_INITIAL

    function connect() {
      const token = getAccessToken()
      if (!token || !active) { return }

      ws = new WebSocket(`${wsBaseUrl}${WS_PATH}?token=${encodeURIComponent(token)}`)

      ws.onopen = () => {
        backoff = BACKOFF_INITIAL
      }

      ws.onmessage = (e: MessageEvent<string>) => {
        try {
          const msg: unknown = JSON.parse(e.data)
          if (
            msg !== null &&
            typeof msg === 'object' &&
            'event' in msg &&
            (msg as Record<string, unknown>)['event'] === 'notification.created'
          ) {
            void queryClient.invalidateQueries({ queryKey: ['notifications'] })
          }
        } catch {
          // игнорируем нераспознанные фреймы
        }
      }

      ws.onclose = (e: CloseEvent) => {
        ws = null
        if (!active) { return }

        if (e.code === CLOSE_AUTH) {
          const refreshToken = getRefreshToken()
          if (!refreshToken) { return }
          void requestRefreshTokens({ refresh_token: refreshToken })
            .then((data) => {
              if (!active) { return }
              setTokens(data.access_token, data.refresh_token ?? refreshToken)
              backoff = BACKOFF_INITIAL
              connect()
            })
            .catch(() => { /* токен невалиден, выходим */ })
          return
        }

        const delay = backoff
        backoff = Math.min(backoff * 2, BACKOFF_MAX)
        timer = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      active = false
      if (timer !== null) { clearTimeout(timer) }
      ws?.close()
    }
  }, [enabled, queryClient])
}
