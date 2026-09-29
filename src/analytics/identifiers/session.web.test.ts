export {}

const THIRTY_MINUTES = 30 * 60 * 1e3
const NOW = new Date('2026-09-29T12:00:00.000Z')
const SESSION_RECORD_KEY = 'bsky_session'

class TestStorage {
  private values = new Map<string, string>()

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

const mockOnAppStateChange = jest.fn()
const mockUuidV4 = jest.fn<unknown, []>()

let mockAppStateListener: ((state: string) => void) | undefined

jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: mockUuidV4},
}))

jest.mock('#/env', () => ({IS_NATIVE: false}))

jest.mock('#/lib/appState', () => ({
  onAppStateChange: mockOnAppStateChange,
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.resetModules()
  jest.clearAllMocks()
  mockAppStateListener = undefined
  mockUuidV4.mockReturnValue('session-a')
  mockOnAppStateChange.mockImplementation(listener => {
    mockAppStateListener = listener
    return {remove: jest.fn()}
  })
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {sessionStorage: new TestStorage()},
  })
})

afterEach(() => {
  jest.useRealTimers()
  Reflect.deleteProperty(globalThis, 'window')
})

function setSessionRecord(id: string, lastEventAt: number) {
  window.sessionStorage.setItem(
    SESSION_RECORD_KEY,
    JSON.stringify({id, lastEventAt}),
  )
}

function getSessionRecord() {
  const value = window.sessionStorage.getItem(SESSION_RECORD_KEY)
  return value ? JSON.parse(value) : undefined
}

function loadSession(): typeof import('./session.web') {
  return require('./session.web')
}

describe('web session identifier', () => {
  it('creates and persists one session record', () => {
    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionRecord()).toEqual({
      id: 'session-a',
      lastEventAt: NOW.getTime(),
    })
  })

  it('reuses an unexpired session and updates its timestamp atomically', () => {
    setSessionRecord('existing-session', NOW.getTime() - 1)

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(getSessionRecord()).toEqual({
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

    jest.advanceTimersByTime(THIRTY_MINUTES)
    mockAppStateListener?.('active')

    expect(getSessionId()).toBe('session-a')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(getSessionRecord()).toEqual({
      id: 'session-a',
      lastEventAt: NOW.getTime() + THIRTY_MINUTES,
    })
  })

  it('tracks inactivity before subscribers mount', () => {
    setSessionRecord('existing-session', NOW.getTime())
    const {getSessionId} = loadSession()

    mockAppStateListener?.('background')
    jest.advanceTimersByTime(THIRTY_MINUTES)
    mockAppStateListener?.('active')

    expect(getSessionId()).toBe('session-a')
  })
})
