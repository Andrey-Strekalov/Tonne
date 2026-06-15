import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useNotificationsWS } from '@/app/providers/useNotificationsWS'
import * as authLib from '@/shared/lib/auth'
import * as authRefreshApi from '@/shared/api/auth-refresh'

jest.mock('@/shared/config', () => ({
  wsBaseUrl: 'ws://testhost:8000',
  apiBaseUrl: 'http://testhost:8000',
}))

jest.mock('@/shared/lib/auth', () => ({
  getAccessToken: jest.fn(),
  getRefreshToken: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
  hasTokens: jest.fn(),
}))

jest.mock('@/shared/api/auth-refresh', () => ({
  requestRefreshTokens: jest.fn(),
}))

type MockWs = {
  url: string
  close: jest.Mock
  onopen: ((e: Event) => void) | null
  onmessage: ((e: MessageEvent<string>) => void) | null
  onclose: ((e: CloseEvent) => void) | null
}

const mockWsInstances: MockWs[] = []

beforeAll(() => {
  Object.defineProperty(global, 'WebSocket', {
    writable: true,
    configurable: true,
    value: jest.fn(),
  })
})

beforeEach(() => {
  mockWsInstances.length = 0
  jest.spyOn(global, 'WebSocket').mockImplementation((url: string | URL) => {
    const inst: MockWs = {
      url: String(url),
      close: jest.fn(),
      onopen: null,
      onmessage: null,
      onclose: null,
    }
    mockWsInstances.push(inst)
    return inst as unknown as WebSocket
  })
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useNotificationsWS', () => {
  it('creates WebSocket with correct URL when enabled=true and token exists', () => {
    jest.mocked(authLib.getAccessToken).mockReturnValue('test-token')

    const queryClient = new QueryClient()
    renderHook(() => useNotificationsWS(true), { wrapper: makeWrapper(queryClient) })

    expect(global.WebSocket).toHaveBeenCalledTimes(1)
    expect(global.WebSocket).toHaveBeenCalledWith(
      'ws://testhost:8000/ws/notifications/?token=test-token',
    )
  })

  it('does not create WebSocket when enabled=false', () => {
    jest.mocked(authLib.getAccessToken).mockReturnValue('test-token')

    const queryClient = new QueryClient()
    renderHook(() => useNotificationsWS(false), { wrapper: makeWrapper(queryClient) })

    expect(global.WebSocket).not.toHaveBeenCalled()
  })

  it('calls invalidateQueries with notifications key on notification.created message', () => {
    jest.mocked(authLib.getAccessToken).mockReturnValue('test-token')

    const queryClient = new QueryClient()
    const invalidateSpy = jest
      .spyOn(queryClient, 'invalidateQueries')
      .mockImplementation(() => Promise.resolve())

    renderHook(() => useNotificationsWS(true), { wrapper: makeWrapper(queryClient) })

    const ws = mockWsInstances[0]
    act(() => {
      ws.onmessage?.({
        data: JSON.stringify({ event: 'notification.created' }),
      } as MessageEvent<string>)
    })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notifications'] })
  })

  it('calls requestRefreshTokens when WebSocket closes with code 4001', () => {
    jest.mocked(authLib.getAccessToken).mockReturnValue('test-token')
    jest.mocked(authLib.getRefreshToken).mockReturnValue('refresh-token')
    const refreshSpy = jest
      .mocked(authRefreshApi.requestRefreshTokens)
      .mockResolvedValue({ access_token: 'new-access', refresh_token: 'new-refresh' })

    const queryClient = new QueryClient()
    renderHook(() => useNotificationsWS(true), { wrapper: makeWrapper(queryClient) })

    const ws = mockWsInstances[0]
    act(() => {
      ws.onclose?.({ code: 4001 } as CloseEvent)
    })

    expect(refreshSpy).toHaveBeenCalledWith({ refresh_token: 'refresh-token' })
  })

  it('calls ws.close() when hook unmounts', () => {
    jest.mocked(authLib.getAccessToken).mockReturnValue('test-token')

    const queryClient = new QueryClient()
    const { unmount } = renderHook(() => useNotificationsWS(true), {
      wrapper: makeWrapper(queryClient),
    })

    const ws = mockWsInstances[0]
    unmount()

    expect(ws.close).toHaveBeenCalled()
  })
})
