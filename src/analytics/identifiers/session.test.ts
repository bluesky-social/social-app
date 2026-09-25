import {act, renderHook} from '@testing-library/react-native'

const FIVE_MINUTES = 5 * 60 * 1e3
const NOW = new Date('2026-09-22T12:00:00.000Z')

const mockDeviceValues = new Map<string, unknown>()
const mockDeviceListeners = new Map<string, Set<() => void>>()
const mockDeviceGet = jest.fn((key: string[]) =>
  mockDeviceValues.get(key.join(':')),
)
const mockDeviceSet = jest.fn((key: string[], value: unknown) => {
  const storageKey = key.join(':')
  mockDeviceValues.set(storageKey, value)
  mockDeviceListeners.get(storageKey)?.forEach(listener => listener())
})
const mockDeviceRemove = jest.fn((key: string[]) => {
  mockDeviceValues.delete(key.join(':'))
})
const mockDeviceAddOnValueChangedListener = jest.fn(
  (key: string[], listener: () => void) => {
    const storageKey = key.join(':')
    const listeners = mockDeviceListeners.get(storageKey) ?? new Set()
    listeners.add(listener)
    mockDeviceListeners.set(storageKey, listeners)
    return {
      remove: jest.fn(() => {
        listeners.delete(listener)
      }),
    }
  },
)

const mockAppStateListeners = new Set<(state: string) => void>()
let mockCurrentAppState = 'active'
const mockOnAppStateChange = jest.fn((listener: (state: string) => void) => {
  mockAppStateListeners.add(listener)
  return {
    remove: jest.fn(() => {
      mockAppStateListeners.delete(listener)
    }),
  }
})
const mockGetCurrentState = jest.fn(() => mockCurrentAppState)

const mockUuidV4 = jest.fn<unknown, []>()

/*
 * Keep one React instance across module resets. The session module initializes
 * at import time, so each test needs a fresh module without giving renderHook a
 * different React instance from the hook under test.
 */
let mockReact: typeof import('react') | undefined
jest.mock('react', () => {
  mockReact ??= jest.requireActual('react')
  return mockReact
})

jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: mockUuidV4},
}))

jest.mock('#/storage', () => ({
  device: {
    get: mockDeviceGet,
    set: mockDeviceSet,
    remove: mockDeviceRemove,
    addOnValueChangedListener: mockDeviceAddOnValueChangedListener,
  },
}))

jest.mock('#/lib/appState', () => ({
  getCurrentState: mockGetCurrentState,
  onAppStateChange: mockOnAppStateChange,
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.clearAllMocks()
  mockDeviceValues.clear()
  mockDeviceListeners.clear()
  mockAppStateListeners.clear()
  mockCurrentAppState = 'active'
  mockUuidV4.mockReset().mockReturnValue('session-a')
})

afterEach(() => {
  jest.useRealTimers()
})

function setSessionRecord(record: unknown) {
  mockDeviceValues.set('nativeSession', record)
}

function setStoredSession(id: string, lastEventAt?: number) {
  setSessionRecord({
    id,
    inactivityAt: lastEventAt,
    rotatedAt: lastEventAt,
  })
}

function emitAppState(state: string) {
  mockCurrentAppState = state
  mockAppStateListeners.forEach(listener => listener(state))
}

function loadSession(): typeof import('./session') {
  let session: typeof import('./session') | undefined
  jest.isolateModules(() => {
    session = require('./session')
  })
  return session!
}

describe('native session initialization', () => {
  it('creates exactly one session when none exists', () => {
    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenCalledWith(['nativeSession'], {
      id: 'session-a',
      rotatedAt: NOW.getTime(),
    })
  })

  it('creates a session when initialized in the background without one', () => {
    mockCurrentAppState = 'background'

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  it('reuses an unexpired stored session', () => {
    setStoredSession('existing-session', NOW.getTime() - FIVE_MINUTES + 1)

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(mockDeviceValues.get('nativeSession')).toMatchObject({
      id: 'existing-session',
      rotatedAt: NOW.getTime() - FIVE_MINUTES + 1,
    })
  })

  it('rotates an active stored session at the exact five-minute boundary', () => {
    setStoredSession('existing-session', NOW.getTime() - FIVE_MINUTES)

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['missing', undefined],
    ['malformed', Number.NaN],
  ])('preserves an existing session with a %s timestamp', (_, timestamp) => {
    setStoredSession('existing-session', timestamp)

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  test('defers rotating an expired stored session initialized in the background', () => {
    mockCurrentAppState = 'background'
    setStoredSession('existing-session', NOW.getTime() - FIVE_MINUTES)

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('does not rotate a session younger than five minutes', () => {
    setSessionRecord({
      id: 'existing-session',
      inactivityAt: NOW.getTime() - FIVE_MINUTES,
      rotatedAt: NOW.getTime() - FIVE_MINUTES + 1,
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('normalizes malformed record timestamps without rotating', () => {
    setSessionRecord({
      id: 'existing-session',
      inactivityAt: 'invalid',
      rotatedAt: 'invalid',
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(mockDeviceValues.get('nativeSession')).toEqual({
      id: 'existing-session',
      inactivityAt: undefined,
      rotatedAt: NOW.getTime(),
    })
  })

  it('clamps future record timestamps to the current time', () => {
    mockCurrentAppState = 'background'
    setSessionRecord({
      id: 'existing-session',
      inactivityAt: NOW.getTime() + FIVE_MINUTES,
      rotatedAt: NOW.getTime() + FIVE_MINUTES,
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(mockDeviceValues.get('nativeSession')).toEqual({
      id: 'existing-session',
      inactivityAt: NOW.getTime(),
      rotatedAt: NOW.getTime(),
    })
  })

  it('ignores obsolete session keys', () => {
    mockDeviceValues.set('nativeSessionId', 'obsolete-session')
    mockDeviceValues.set('nativeSessionIdLastEventAt', NOW.getTime())

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(mockDeviceRemove).not.toHaveBeenCalled()
    expect(mockDeviceValues.get('nativeSession')).toEqual({
      id: 'session-a',
      rotatedAt: NOW.getTime(),
    })
  })

  it('replaces an unreadable stored session without crashing', () => {
    mockDeviceGet.mockImplementationOnce(() => {
      throw new SyntaxError('Invalid persisted JSON')
    })

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(mockDeviceValues.get('nativeSession')).toEqual({
      id: 'session-a',
      rotatedAt: NOW.getTime(),
    })
  })
})

describe('native session lifecycle', () => {
  it('does not rotate when foregrounded before five minutes', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('background'))
    jest.advanceTimersByTime(FIVE_MINUTES - 1)
    act(() => emitAppState('active'))

    expect(hook.result.current).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('rotates once when foregrounded at the exact five-minute boundary', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('background'))
    jest.advanceTimersByTime(FIVE_MINUTES)
    act(() => emitAppState('active'))

    expect(hook.result.current).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(mockDeviceValues.get('nativeSession')).toEqual({
      id: 'session-a',
      inactivityAt: undefined,
      rotatedAt: NOW.getTime() + FIVE_MINUTES,
    })
  })

  it('does not rotate again inside five minutes', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('background'))
    jest.advanceTimersByTime(FIVE_MINUTES)
    act(() => emitAppState('active'))
    act(() => emitAppState('background'))
    jest.advanceTimersByTime(FIVE_MINUTES - 1)
    act(() => emitAppState('active'))

    expect(hook.result.current).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  test('does not erase the inactivity start during intermediate states', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('inactive'))
    jest.advanceTimersByTime(FIVE_MINUTES - 1)
    act(() => emitAppState('background'))
    jest.advanceTimersByTime(1)
    act(() => emitAppState('active'))

    expect(hook.result.current).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  test('uses one app-state listener for every mounted consumer', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    renderHook(() => {
      useSessionId()
      useSessionId()
      useSessionId()
    })

    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
  })

  test('updates every mounted consumer after rotating once', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => {
      const first = useSessionId()
      const second = useSessionId()
      const third = useSessionId()
      return [first, second, third]
    })

    expect(hook.result.current).toEqual([
      'existing-session',
      'existing-session',
      'existing-session',
    ])

    act(() => emitAppState('background'))
    jest.advanceTimersByTime(FIVE_MINUTES)
    act(() => emitAppState('active'))

    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(hook.result.current).toEqual(['session-a', 'session-a', 'session-a'])
  })

  test('updates consumers when the persisted session changes', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() =>
      mockDeviceSet(['nativeSession'], {
        id: 'external-session',
        rotatedAt: NOW.getTime(),
      }),
    )

    expect(hook.result.current).toBe('external-session')
  })

  test('keeps the shared listener until the last consumer unmounts', () => {
    setStoredSession('existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const first = renderHook(() => useSessionId())
    const second = renderHook(() => useSessionId())

    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
    expect(mockAppStateListeners.size).toBe(1)

    first.unmount()
    expect(mockAppStateListeners.size).toBe(1)

    second.unmount()
    expect(mockAppStateListeners.size).toBe(0)
  })
})
