const NOW = new Date('2026-09-22T12:00:00.000Z')
const mockDeviceValues = new Map<string, unknown>()
const mockDeviceGet = jest.fn((key: string[]) => mockDeviceValues.get(key[0]))
const mockDeviceSet = jest.fn((key: string[], value: unknown) => {
  mockDeviceValues.set(key[0], value)
})
const mockDeviceSubscribe = jest.fn()
const mockAppStateListeners = new Set<(state: string) => void>()
const mockOnAppStateChange = jest.fn((listener: (state: string) => void) => {
  mockAppStateListeners.add(listener)
  return {remove: () => mockAppStateListeners.delete(listener)}
})
const mockUuidV4 = jest.fn<unknown, []>()
let mockIsNative = true

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
    const {getSessionId} = loadSession()

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

  describe.each(['read', 'active', 'inactive', 'background'])(
    'recovering through %s',
    trigger => {
      it.each(['missing', 'invalid', 'malformed JSON'])(
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
          } else if (failure === 'invalid') {
            mockDeviceValues.set('analyticsSession', {id: ''})
          } else {
            mockDeviceGet.mockImplementationOnce(() => {
              throw new SyntaxError('Invalid persisted JSON')
            })
          }
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

  it('rotates once at the exact boundary without React or storage subscribers', () => {
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
    expect(mockDeviceSubscribe).not.toHaveBeenCalled()
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

  it('reads local storage writes without a subscription', () => {
    const {getSessionId} = loadSession()

    mockDeviceSet(['analyticsSession'], {
      id: 'local-session',
      lastEventAt: Date.now(),
    })

    expect(getSessionId()).toBe('local-session')
    expect(mockDeviceSubscribe).not.toHaveBeenCalled()
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
    expect(mockDeviceSubscribe).not.toHaveBeenCalled()
  })
})
