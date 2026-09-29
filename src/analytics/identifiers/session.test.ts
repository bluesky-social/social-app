import {act, renderHook} from '@testing-library/react-native'

const NOW = new Date('2026-09-22T12:00:00.000Z')
const mockDeviceValues = new Map<string, unknown>()
const mockDeviceListeners = new Set<() => void>()
const mockDeviceGet = jest.fn((key: string[]) => mockDeviceValues.get(key[0]))
const mockDeviceSet = jest.fn((key: string[], value: unknown) => {
  mockDeviceValues.set(key[0], value)
  mockDeviceListeners.forEach(listener => listener())
})
const mockDeviceSubscribe = jest.fn((_: string[], listener: () => void) => {
  mockDeviceListeners.add(listener)
  return {remove: () => mockDeviceListeners.delete(listener)}
})
const mockAppStateListeners = new Set<(state: string) => void>()
const mockOnAppStateChange = jest.fn((listener: (state: string) => void) => {
  mockAppStateListeners.add(listener)
  return {remove: () => mockAppStateListeners.delete(listener)}
})
const mockUuidV4 = jest.fn<unknown, []>()
let mockIsNative = true

/* Keep the renderer and isolated session modules on the same React instance. */
let mockReact: typeof import('react') | undefined
jest.mock('react', () => {
  mockReact ??= jest.requireActual('react')
  return mockReact
})
jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: mockUuidV4},
}))
jest.mock('#/env', () => ({IS_NATIVE: mockIsNative}))
jest.mock('#/storage', () => ({
  device: {
    get: mockDeviceGet,
    set: mockDeviceSet,
    addOnValueChangedListener: mockDeviceSubscribe,
  },
}))
jest.mock('#/lib/appState', () => ({
  onAppStateChange: mockOnAppStateChange,
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.clearAllMocks()
  mockDeviceValues.clear()
  mockDeviceListeners.clear()
  mockAppStateListeners.clear()
  mockUuidV4.mockReset().mockReturnValue('session-a')
})
afterEach(() => jest.useRealTimers())

function setStoredSession(id: string, lastEventAt?: number) {
  mockDeviceValues.set('analyticsSession', {id, lastEventAt})
}

function emitAppState(state: string) {
  mockAppStateListeners.forEach(listener => listener(state))
}

function loadSession(): typeof import('./session') {
  let session: typeof import('./session') | undefined
  jest.isolateModules(() => {
    session = require('./session')
  })
  return session!
}

describe.each([
  {platform: 'native', isNative: true, ttl: 5 * 60 * 1e3},
  {platform: 'web', isNative: false, ttl: 30 * 60 * 1e3},
])('$platform analytics sessions', ({isNative, ttl}) => {
  beforeEach(() => {
    mockIsNative = isNative
  })

  it('creates and persists the ID and timestamp in one write', () => {
    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledWith(['analyticsSession'], {
      id: 'session-a',
      lastEventAt: NOW.getTime(),
    })
  })

  it('reuses an unexpired stored session', () => {
    mockDeviceValues.set('analyticsSession', {
      id: 'existing-session',
      lastEventAt: NOW.getTime() - ttl + 1,
      extra: true,
    })
    const {getSessionId} = loadSession()

    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(mockDeviceValues.get('analyticsSession')).toEqual({
      id: 'existing-session',
      lastEventAt: NOW.getTime(),
    })
  })

  it('rotates an expired stored session on startup at the exact boundary', () => {
    setStoredSession('existing-session', NOW.getTime() - ttl)
    const {getSessionId} = loadSession()

    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, null, '123', Number.NaN, Infinity, -Infinity])(
    'preserves a session with an invalid or missing timestamp: %s',
    lastEventAt => {
      mockDeviceValues.set('analyticsSession', {
        id: 'existing-session',
        lastEventAt,
      })
      const {getSessionId} = loadSession()

      expect(getSessionId()).toBe('existing-session')
      expect(mockUuidV4).not.toHaveBeenCalled()
    },
  )

  it.each([undefined, null, 'session-a', [], {}, {id: ''}, {id: 123}])(
    'replaces an invalid record: %j',
    record => {
      mockDeviceValues.set('analyticsSession', record)
      const {getSessionId} = loadSession()

      expect(getSessionId()).toBe('session-a')
      expect(mockDeviceSet).toHaveBeenCalledWith(['analyticsSession'], {
        id: 'session-a',
        lastEventAt: NOW.getTime(),
      })
    },
  )

  it('replaces malformed JSON', () => {
    mockDeviceGet.mockImplementationOnce(() => {
      throw new SyntaxError('Invalid persisted JSON')
    })
    expect(loadSession().getSessionId()).toBe('session-a')
  })

  it('does not rotate before the inactivity threshold', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('background'))
    jest.advanceTimersByTime(ttl - 1)
    act(() => emitAppState('active'))

    expect(hook.result.current).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('rotates once and updates every consumer at the exact boundary', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId, getSessionId} = loadSession()
    const hook = renderHook(() => [
      useSessionId(),
      useSessionId(),
      useSessionId(),
    ])
    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
    expect(mockDeviceSubscribe).toHaveBeenCalledTimes(1)
    expect(mockDeviceSubscribe).toHaveBeenCalledWith(
      ['analyticsSession'],
      expect.any(Function),
    )

    act(() => emitAppState('background'))
    jest.advanceTimersByTime(ttl)
    mockDeviceSet.mockClear()
    act(() => emitAppState('active'))

    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(hook.result.current).toEqual(['session-a', 'session-a', 'session-a'])
    expect(getSessionId()).toBe('session-a')
    expect(mockDeviceSet).toHaveBeenCalledTimes(1)
    expect(mockDeviceValues.get('analyticsSession')).toEqual({
      id: 'session-a',
      lastEventAt: NOW.getTime() + ttl,
    })
  })

  it('keeps the original last-event semantics across intermediate states', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('inactive'))
    jest.advanceTimersByTime(ttl - 1)
    act(() => emitAppState('background'))
    jest.advanceTimersByTime(1)
    act(() => emitAppState('active'))

    expect(hook.result.current).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('updates all consumers synchronously notified by a local storage write', () => {
    const {useSessionId, getSessionId} = loadSession()
    const hook = renderHook(() => [useSessionId(), useSessionId()])

    act(() =>
      mockDeviceSet(['analyticsSession'], {
        id: 'local-session',
        lastEventAt: Date.now(),
      }),
    )

    expect(hook.result.current).toEqual(['local-session', 'local-session'])
    expect(getSessionId()).toBe('local-session')
  })

  it('tracks inactivity before subscribers mount', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {getSessionId, useSessionId} = loadSession()

    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
    expect(mockDeviceListeners.size).toBe(0)
    emitAppState('background')
    jest.advanceTimersByTime(ttl)
    emitAppState('active')

    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    const hook = renderHook(() => useSessionId())
    expect(hook.result.current).toBe('session-a')
    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
  })

  it('cleans up storage subscriptions but keeps tracking lifecycle between mounts', () => {
    const {useSessionId, getSessionId} = loadSession()
    const first = renderHook(() => useSessionId())
    const second = renderHook(() => useSessionId())
    first.unmount()
    expect(mockAppStateListeners.size).toBe(1)
    expect(mockDeviceListeners.size).toBe(1)
    second.unmount()
    expect(mockAppStateListeners.size).toBe(1)
    expect(mockDeviceListeners.size).toBe(0)

    emitAppState('background')
    jest.advanceTimersByTime(ttl)
    mockUuidV4.mockReturnValueOnce('session-b')
    emitAppState('active')
    expect(getSessionId()).toBe('session-b')

    const third = renderHook(() => useSessionId())
    expect(third.result.current).toBe('session-b')
    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
    expect(mockAppStateListeners.size).toBe(1)
    expect(mockDeviceListeners.size).toBe(1)
    third.unmount()
    expect(mockAppStateListeners.size).toBe(1)
    expect(mockDeviceListeners.size).toBe(0)
  })
})
