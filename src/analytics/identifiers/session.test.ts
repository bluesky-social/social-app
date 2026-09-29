const NOW = new Date('2026-09-22T12:00:00.000Z')
const mockDeviceValues = new Map<string, unknown>()
const mockDeviceGetRaw = jest.fn((key: string[]) => {
  if (!mockDeviceValues.has(key[0])) return undefined
  return JSON.stringify({data: mockDeviceValues.get(key[0])})
})
const mockDeviceListeners = new Set<() => void>()
const mockDeviceSet = jest.fn((key: string[], value: unknown) => {
  mockDeviceValues.set(key[0], value)
  emitStorageChange()
})
const mockDeviceSubscribe = jest.fn((_key: string[], listener: () => void) => {
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
let sessionValidation: jest.SpyInstance

jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: mockUuidV4},
}))
jest.mock('#/env', () => ({IS_NATIVE: mockIsNative}))
jest.mock('#/analytics/identifiers/sessionStorage', () =>
  jest.requireActual<typeof import('./sessionStorage')>(
    mockIsNative
      ? '#/analytics/identifiers/sessionStorage/index.ts'
      : '#/analytics/identifiers/sessionStorage/index.web.ts',
  ),
)
jest.mock('#/storage', () => ({
  device: {
    getRaw: mockDeviceGetRaw,
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
afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

function emitStorageChange() {
  mockDeviceListeners.forEach(listener => listener())
}

function setStoredSession(id: string, lastEventAt?: number) {
  mockDeviceValues.set('analyticsSession', {id, lastEventAt})
  emitStorageChange()
}

function emitAppState(state: string) {
  mockAppStateListeners.forEach(listener => listener(state))
}

function loadSession(): typeof import('./session') {
  let session: typeof import('./session') | undefined
  jest.isolateModules(() => {
    const {z} = require('zod') as typeof import('zod')
    sessionValidation = jest.spyOn(z.ZodType.prototype, 'safeParse')
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
    const {getSessionId} = loadSession()

    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledWith(['analyticsSession'], {
      id: 'session-a',
      lastEventAt: NOW.getTime(),
    })
  })

  it('reuses validated data with native cached reads and web read-through', () => {
    const {getSessionId} = loadSession()
    getSessionId()
    mockDeviceGetRaw.mockClear()
    sessionValidation.mockClear()
    const parse = jest.spyOn(JSON, 'parse')

    for (let i = 0; i < 100; i++) getSessionId()

    expect(sessionValidation).not.toHaveBeenCalled()
    expect(parse).not.toHaveBeenCalled()
    expect(mockDeviceGetRaw).toHaveBeenCalledTimes(isNative ? 0 : 100)
  })

  it('parses and validates a changed raw value once', () => {
    const {getSessionId} = loadSession()
    getSessionId()
    mockDeviceGetRaw.mockClear()
    sessionValidation.mockClear()
    const parse = jest.spyOn(JSON, 'parse')

    setStoredSession('other-runtime-session', Date.now())
    expect(getSessionId()).toBe('other-runtime-session')
    expect(getSessionId()).toBe('other-runtime-session')

    expect(parse).toHaveBeenCalledTimes(1)
    expect(sessionValidation).toHaveBeenCalledTimes(1)
    expect(mockDeviceGetRaw).toHaveBeenCalledTimes(isNative ? 1 : 2)
    expect(mockDeviceSubscribe).toHaveBeenCalledTimes(isNative ? 1 : 0)
  })

  it('observes timestamp-only changes before deciding whether to rotate', () => {
    const {getSessionId} = loadSession()
    expect(getSessionId()).toBe('session-a')
    setStoredSession('session-a', Date.now() - ttl)
    mockUuidV4.mockReturnValueOnce('session-b')

    emitAppState('active')

    expect(getSessionId()).toBe('session-b')
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

  it.each(['{', 'null', '[]', '42', '"string"', '{}'])(
    'replaces malformed or invalid serialized storage: %s',
    raw => {
      mockDeviceGetRaw.mockReturnValueOnce(raw)
      expect(loadSession().getSessionId()).toBe('session-a')
    },
  )

  describe.each(['read', 'active', 'inactive', 'background'])(
    'recovering through %s',
    trigger => {
      it.each(['missing', 'cleared', 'invalid', 'malformed JSON'])(
        'persists a fresh session after rotation when storage is %s',
        failure => {
          const {getSessionId} = loadSession()
          expect(getSessionId()).toBe('session-a')
          emitAppState('background')
          jest.advanceTimersByTime(ttl)
          mockUuidV4.mockReturnValueOnce('session-b')
          emitAppState('active')
          expect(getSessionId()).toBe('session-b')

          if (failure === 'missing') {
            mockDeviceValues.delete('analyticsSession')
          } else if (failure === 'cleared') {
            mockDeviceValues.clear()
          } else if (failure === 'invalid') {
            mockDeviceValues.set('analyticsSession', {id: ''})
          } else {
            mockDeviceGetRaw.mockReturnValueOnce('{')
          }
          emitStorageChange()
          jest.advanceTimersByTime(1_000)
          mockUuidV4.mockReturnValueOnce('session-c')
          mockDeviceSet.mockClear()

          if (trigger !== 'read') emitAppState(trigger)
          expect(getSessionId()).toBe('session-c')
          expect(getSessionId()).toBe('session-c')
          expect(mockUuidV4).toHaveBeenCalledTimes(3)
          expect(mockDeviceSet).toHaveBeenCalledTimes(1)
          expect(mockDeviceValues.get('analyticsSession')).toEqual({
            id: 'session-c',
            lastEventAt: Date.now(),
          })
        },
      )
    },
  )

  it('does not rotate before the inactivity threshold', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {getSessionId} = loadSession()

    emitAppState('background')
    jest.advanceTimersByTime(ttl - 1)
    emitAppState('active')

    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('rotates once at the exact boundary without React consumers', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {getSessionId} = loadSession()
    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)

    emitAppState('background')
    jest.advanceTimersByTime(ttl)
    mockDeviceSet.mockClear()
    emitAppState('active')

    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect([getSessionId(), getSessionId(), getSessionId()]).toEqual([
      'session-a',
      'session-a',
      'session-a',
    ])
    expect(mockDeviceSubscribe).toHaveBeenCalledTimes(isNative ? 1 : 0)
    expect(mockDeviceSet).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledWith(['analyticsSession'], {
      id: 'session-a',
      lastEventAt: NOW.getTime() + ttl,
    })
    expect([...mockDeviceValues.keys()]).toEqual(['analyticsSession'])
  })

  it('keeps the original last-event semantics across intermediate states', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {getSessionId} = loadSession()

    emitAppState('inactive')
    jest.advanceTimersByTime(ttl - 1)
    emitAppState('background')
    jest.advanceTimersByTime(1)
    emitAppState('active')

    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('observes local storage writes without React consumers', () => {
    const {getSessionId} = loadSession()

    mockDeviceSet(['analyticsSession'], {
      id: 'local-session',
      lastEventAt: Date.now(),
    })

    expect(getSessionId()).toBe('local-session')
    expect(mockDeviceSubscribe).toHaveBeenCalledTimes(isNative ? 1 : 0)
  })

  it('keeps tracking repeated lifecycle events when no one reads the ID', () => {
    const {getSessionId} = loadSession()

    emitAppState('background')
    jest.advanceTimersByTime(ttl)
    mockUuidV4.mockReturnValueOnce('session-b')
    emitAppState('active')
    emitAppState('background')
    jest.advanceTimersByTime(ttl)
    mockUuidV4.mockReturnValueOnce('session-c')
    emitAppState('active')

    expect(getSessionId()).toBe('session-c')
    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
    expect(mockAppStateListeners.size).toBe(1)
    expect(mockDeviceSubscribe).toHaveBeenCalledTimes(isNative ? 1 : 0)
  })
})
