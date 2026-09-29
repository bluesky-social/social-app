export {}

const FIVE_MINUTES = 5 * 60 * 1e3
const NOW = new Date('2026-09-29T12:00:00.000Z')

const mockDeviceValues = new Map<string, unknown>()
const mockDeviceGet = jest.fn((key: string[]) =>
  mockDeviceValues.get(key.join(':')),
)
const mockDeviceSet = jest.fn((key: string[], value: unknown) => {
  mockDeviceValues.set(key.join(':'), value)
})
const mockOnAppStateChange = jest.fn()
const mockUuidV4 = jest.fn<unknown, []>()

let mockAppStateListener: ((state: string) => void) | undefined

jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: mockUuidV4},
}))

jest.mock('#/storage', () => ({
  device: {
    get: mockDeviceGet,
    set: mockDeviceSet,
  },
}))

jest.mock('#/lib/appState', () => ({
  onAppStateChange: mockOnAppStateChange,
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.resetModules()
  jest.clearAllMocks()
  mockDeviceValues.clear()
  mockAppStateListener = undefined
  mockUuidV4.mockReturnValue('session-a')
  mockOnAppStateChange.mockImplementation(listener => {
    mockAppStateListener = listener
    return {remove: jest.fn()}
  })
})

afterEach(() => {
  jest.useRealTimers()
})

function setSessionRecord(id: string, lastEventAt: number) {
  mockDeviceValues.set('nativeSession', {id, lastEventAt})
}

function loadSession(): typeof import('./session') {
  return require('./session')
}

describe('native session identifier', () => {
  it('creates and persists one session record', () => {
    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(mockDeviceSet).toHaveBeenCalledWith(['nativeSession'], {
      id: 'session-a',
      lastEventAt: NOW.getTime(),
    })
  })

  it('reuses an unexpired session and updates its timestamp atomically', () => {
    setSessionRecord('existing-session', NOW.getTime() - 1)

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(mockDeviceSet).toHaveBeenCalledWith(['nativeSession'], {
      id: 'existing-session',
      lastEventAt: NOW.getTime(),
    })
  })

  it('rotates once and updates every subscriber', () => {
    setSessionRecord('existing-session', NOW.getTime())
    const {getSessionId, subscribeToSessionId} = loadSession()
    const first = jest.fn()
    const second = jest.fn()
    subscribeToSessionId(first)
    subscribeToSessionId(second)

    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(FIVE_MINUTES)
    mockAppStateListener?.('active')

    expect(getSessionId()).toBe('session-a')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(mockDeviceSet).toHaveBeenLastCalledWith(['nativeSession'], {
      id: 'session-a',
      lastEventAt: NOW.getTime() + FIVE_MINUTES,
    })
  })

  it('tracks inactivity before subscribers mount', () => {
    setSessionRecord('existing-session', NOW.getTime())
    const {getSessionId} = loadSession()

    mockAppStateListener?.('background')
    jest.advanceTimersByTime(FIVE_MINUTES)
    mockAppStateListener?.('active')

    expect(getSessionId()).toBe('session-a')
  })
})
