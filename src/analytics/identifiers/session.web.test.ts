import {act, renderHook} from '@testing-library/react-native'

const THIRTY_MINUTES = 30 * 60 * 1e3
const NOW = new Date('2026-09-22T12:00:00.000Z')
const SESSION_RECORD_KEY = 'bsky_analytics_session_v1'

type StorageListener = (event: {
  key: string | null
  newValue: string | null
  oldValue: string | null
  storageArea: TestStorage
}) => void
type PageHideListener = () => void

const mockWindows = new Map<string, TestWindow>()
const mockSharedLocalStorage = new Map<string, string>()
let mockActiveTabId = 'tab-a'

class TestStorage {
  constructor(
    private values: Map<string, string>,
    private ownerTabId: string,
    private shared: boolean,
  ) {}

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    const oldValue = this.getItem(key)
    this.values.set(key, value)
    if (!this.shared) return
    mockWindows.forEach((target, tabId) => {
      if (tabId !== this.ownerTabId) {
        target.dispatchStorage({
          key,
          newValue: value,
          oldValue,
          storageArea: target.localStorage,
        })
      }
    })
  }

  removeItem(key: string) {
    const oldValue = this.getItem(key)
    this.values.delete(key)
    if (!this.shared) return
    mockWindows.forEach((target, tabId) => {
      if (tabId !== this.ownerTabId) {
        target.dispatchStorage({
          key,
          newValue: null,
          oldValue,
          storageArea: target.localStorage,
        })
      }
    })
  }

  clear() {
    this.values.clear()
  }
}

class TestWindow {
  localStorage: TestStorage
  sessionStorage: TestStorage
  private storageListeners = new Set<StorageListener>()
  private pageHideListeners = new Set<PageHideListener>()

  constructor(readonly tabId: string) {
    this.localStorage = new TestStorage(mockSharedLocalStorage, tabId, true)
    this.sessionStorage = new TestStorage(new Map(), tabId, false)
  }

  addEventListener(type: string, listener: StorageListener | PageHideListener) {
    if (type === 'storage') {
      this.storageListeners.add(listener)
    } else if (type === 'pagehide') {
      this.pageHideListeners.add(listener as PageHideListener)
    }
  }

  removeEventListener(
    type: string,
    listener: StorageListener | PageHideListener,
  ) {
    if (type === 'storage') {
      this.storageListeners.delete(listener)
    } else if (type === 'pagehide') {
      this.pageHideListeners.delete(listener as PageHideListener)
    }
  }

  dispatchStorage(event: Parameters<StorageListener>[0]) {
    this.storageListeners.forEach(listener => listener(event))
  }

  dispatchPageHide() {
    this.pageHideListeners.forEach(listener => listener())
  }

  get storageListenerCount() {
    return this.storageListeners.size
  }

  get pageHideListenerCount() {
    return this.pageHideListeners.size
  }
}

const mockAppStateListeners = new Map<string, Set<(state: string) => void>>()
const mockCurrentAppStates = new Map<string, string>()
const mockOnAppStateChange = jest.fn((listener: (state: string) => void) => {
  const tabId = mockActiveTabId
  const listeners = mockAppStateListeners.get(tabId) ?? new Set()
  listeners.add(listener)
  mockAppStateListeners.set(tabId, listeners)
  return {
    remove: jest.fn(() => {
      listeners.delete(listener)
    }),
  }
})
const mockGetCurrentState = jest.fn(
  () => mockCurrentAppStates.get(mockActiveTabId) ?? 'active',
)

const mockUuidV4 = jest.fn<unknown, []>()

let mockReact: typeof import('react') | undefined
jest.mock('react', () => {
  mockReact ??= jest.requireActual('react')
  return mockReact
})

jest.mock('react-native-uuid', () => ({
  __esModule: true,
  default: {v4: mockUuidV4},
}))

jest.mock('#/env', () => ({IS_NATIVE: false}))

jest.mock('#/lib/appState', () => ({
  getCurrentState: mockGetCurrentState,
  onAppStateChange: mockOnAppStateChange,
}))

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(NOW)
  jest.clearAllMocks()
  mockWindows.clear()
  mockSharedLocalStorage.clear()
  mockAppStateListeners.clear()
  mockCurrentAppStates.clear()
  mockActiveTabId = 'tab-a'
  mockUuidV4.mockReset().mockReturnValue('session-a')
  setActiveTab('tab-a')
})

afterEach(() => {
  jest.useRealTimers()
  Reflect.deleteProperty(globalThis, 'window')
})

function setActiveTab(tabId: string) {
  let target = mockWindows.get(tabId)
  if (!target) {
    target = new TestWindow(tabId)
    mockWindows.set(tabId, target)
  }
  mockActiveTabId = tabId
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: target,
  })
  return target
}

function emitAppState(tabId: string, state: string) {
  setActiveTab(tabId)
  mockCurrentAppStates.set(tabId, state)
  mockAppStateListeners.get(tabId)?.forEach(listener => listener(state))
}

function loadSession(tabId = mockActiveTabId): typeof import('./session.web') {
  setActiveTab(tabId)
  let session: typeof import('./session.web') | undefined
  jest.isolateModules(() => {
    session = require('./session.web')
  })
  return session!
}

function setSessionRecord(tabId: string, record: unknown) {
  setActiveTab(tabId).localStorage.setItem(
    SESSION_RECORD_KEY,
    JSON.stringify(record),
  )
}

function setSessionStorageRecord(tabId: string, record: unknown) {
  setActiveTab(tabId).sessionStorage.setItem(
    SESSION_RECORD_KEY,
    JSON.stringify(record),
  )
}

function setStoredSession(tabId: string, id: string, lastEventAt?: number) {
  setSessionRecord(tabId, {
    id,
    inactivityAt: lastEventAt,
    rotatedAt: lastEventAt,
  })
}

function getSessionRecord(tabId: string) {
  const rawRecord = setActiveTab(tabId).localStorage.getItem(SESSION_RECORD_KEY)
  return rawRecord ? JSON.parse(rawRecord) : undefined
}

describe('web session initialization', () => {
  it('creates exactly one session when none exists', () => {
    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(getSessionRecord('tab-a')).toEqual({
      id: 'session-a',
      rotatedAt: NOW.getTime(),
    })
  })

  it('creates a session when initialized in the background without one', () => {
    mockCurrentAppStates.set('tab-a', 'background')

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  it('reuses an unexpired stored session', () => {
    setStoredSession(
      'tab-a',
      'existing-session',
      NOW.getTime() - THIRTY_MINUTES + 1,
    )

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(getSessionRecord('tab-a')).toMatchObject({
      id: 'existing-session',
      rotatedAt: NOW.getTime() - THIRTY_MINUTES + 1,
    })
  })

  it('rotates at the exact thirty-minute boundary', () => {
    setStoredSession(
      'tab-a',
      'existing-session',
      NOW.getTime() - THIRTY_MINUTES,
    )

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('session-a')
    expect(getSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['missing', undefined],
    ['malformed', Number.NaN],
  ])('preserves an existing session with a %s timestamp', (_, timestamp) => {
    setStoredSession('tab-a', 'existing-session', timestamp)

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  test('shares an unexpired session with an independently opened tab', () => {
    const firstTab = loadSession('tab-a')
    const secondTab = loadSession('tab-b')

    expect(firstTab.getInitialSessionId()).toBe('session-a')
    expect(secondTab.getInitialSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  it('migrates the versioned per-tab session record', () => {
    setSessionStorageRecord('tab-a', {
      id: 'existing-session',
      rotatedAt: NOW.getTime(),
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionRecord('tab-a')).toEqual({
      id: 'existing-session',
      rotatedAt: NOW.getTime(),
    })
    expect(
      setActiveTab('tab-a').sessionStorage.getItem(SESSION_RECORD_KEY),
    ).toBeNull()
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('prefers the browser-wide record over stale per-tab data', () => {
    setSessionRecord('tab-a', {
      id: 'browser-session',
      rotatedAt: NOW.getTime(),
    })
    setSessionStorageRecord('tab-a', {
      id: 'tab-session',
      rotatedAt: NOW.getTime(),
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('browser-session')
    expect(getSessionRecord('tab-a')).toEqual({
      id: 'browser-session',
      rotatedAt: NOW.getTime(),
    })
    expect(
      setActiveTab('tab-a').sessionStorage.getItem(SESSION_RECORD_KEY),
    ).toBeNull()
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  test('defers rotating an expired stored session initialized in the background', () => {
    mockCurrentAppStates.set('tab-a', 'background')
    setStoredSession(
      'tab-a',
      'existing-session',
      NOW.getTime() - THIRTY_MINUTES,
    )

    const {getInitialSessionId, getSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(getSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('does not rotate a session younger than thirty minutes', () => {
    setSessionRecord('tab-a', {
      id: 'existing-session',
      inactivityAt: NOW.getTime() - THIRTY_MINUTES,
      rotatedAt: NOW.getTime() - THIRTY_MINUTES + 1,
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('normalizes malformed record timestamps without rotating', () => {
    setSessionRecord('tab-a', {
      id: 'existing-session',
      inactivityAt: 'invalid',
      rotatedAt: 'invalid',
    })

    const {getInitialSessionId} = loadSession()

    expect(getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(getSessionRecord('tab-a')).toEqual({
      id: 'existing-session',
      rotatedAt: NOW.getTime(),
    })
  })
})

describe('web session lifecycle', () => {
  it('does not rotate when foregrounded before thirty minutes', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('tab-a', 'background'))
    jest.advanceTimersByTime(THIRTY_MINUTES - 1)
    act(() => emitAppState('tab-a', 'active'))

    expect(hook.result.current).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  it('rotates once when foregrounded at the thirty-minute boundary', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('tab-a', 'background'))
    jest.advanceTimersByTime(THIRTY_MINUTES)
    act(() => emitAppState('tab-a', 'active'))

    expect(hook.result.current).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(getSessionRecord('tab-a')).toEqual({
      id: 'session-a',
      rotatedAt: NOW.getTime() + THIRTY_MINUTES,
    })
  })

  it('does not rotate again inside thirty minutes', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    const hook = renderHook(() => useSessionId())

    act(() => emitAppState('tab-a', 'background'))
    jest.advanceTimersByTime(THIRTY_MINUTES)
    act(() => emitAppState('tab-a', 'active'))
    act(() => emitAppState('tab-a', 'background'))
    jest.advanceTimersByTime(THIRTY_MINUTES - 1)
    act(() => emitAppState('tab-a', 'active'))

    expect(hook.result.current).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
  })

  test('uses one app-state listener for every mounted consumer', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    const {useSessionId} = loadSession()
    renderHook(() => {
      useSessionId()
      useSessionId()
      useSessionId()
    })

    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
  })

  test('updates every mounted consumer after rotating once', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
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

    act(() => emitAppState('tab-a', 'background'))
    jest.advanceTimersByTime(THIRTY_MINUTES)
    act(() => emitAppState('tab-a', 'active'))

    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(hook.result.current).toEqual(['session-a', 'session-a', 'session-a'])
  })

  test('keeps the shared listener until the last consumer unmounts', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    const target = setActiveTab('tab-a')
    const {useSessionId} = loadSession()
    const first = renderHook(() => useSessionId())
    const second = renderHook(() => useSessionId())

    expect(mockOnAppStateChange).toHaveBeenCalledTimes(1)
    expect(mockAppStateListeners.get('tab-a')?.size).toBe(1)
    expect(target.storageListenerCount).toBe(1)
    expect(target.pageHideListenerCount).toBe(1)

    first.unmount()
    expect(mockAppStateListeners.get('tab-a')?.size).toBe(1)
    expect(target.storageListenerCount).toBe(1)
    expect(target.pageHideListenerCount).toBe(1)

    second.unmount()
    expect(mockAppStateListeners.get('tab-a')?.size).toBe(0)
    expect(target.storageListenerCount).toBe(0)
    expect(target.pageHideListenerCount).toBe(0)
  })

  test('reuses the session when the browser reloads inside thirty minutes', () => {
    setSessionRecord('tab-a', {
      id: 'existing-session',
      rotatedAt: NOW.getTime(),
    })
    const session = loadSession()
    const hook = renderHook(() => session.useSessionId())
    const target = setActiveTab('tab-a')

    act(() => target.dispatchPageHide())
    hook.unmount()
    jest.advanceTimersByTime(THIRTY_MINUTES - 1)

    const reloadedSession = loadSession()

    expect(reloadedSession.getInitialSessionId()).toBe('existing-session')
    expect(mockUuidV4).not.toHaveBeenCalled()
  })

  test('rotates the session when the browser reopens after thirty minutes', () => {
    setSessionRecord('tab-a', {
      id: 'existing-session',
      rotatedAt: NOW.getTime(),
    })
    const session = loadSession()
    const hook = renderHook(() => session.useSessionId())
    const target = setActiveTab('tab-a')

    act(() => target.dispatchPageHide())
    hook.unmount()
    jest.advanceTimersByTime(THIRTY_MINUTES)

    const reopenedSession = loadSession()

    expect(reopenedSession.getInitialSessionId()).toBe('session-a')
    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(getSessionRecord('tab-a')).toEqual({
      id: 'session-a',
      rotatedAt: NOW.getTime() + THIRTY_MINUTES,
    })
  })

  test('updates another tab when one tab rotates the shared session', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    setStoredSession('tab-b', 'existing-session', NOW.getTime())

    const firstTabSession = loadSession('tab-a')
    const firstTabHook = renderHook(() => firstTabSession.useSessionId())
    const secondTabSession = loadSession('tab-b')
    const secondTabHook = renderHook(() => secondTabSession.useSessionId())

    act(() => {
      emitAppState('tab-a', 'background')
      emitAppState('tab-b', 'background')
    })
    jest.advanceTimersByTime(THIRTY_MINUTES)
    act(() => emitAppState('tab-a', 'active'))

    expect(mockUuidV4).toHaveBeenCalledTimes(1)
    expect(firstTabHook.result.current).toBe('session-a')
    expect(secondTabHook.result.current).toBe('session-a')
  })

  test('treats activation in either tab as shared activity', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    setStoredSession('tab-b', 'existing-session', NOW.getTime())

    const firstTabSession = loadSession('tab-a')
    const firstTabHook = renderHook(() => firstTabSession.useSessionId())
    const secondTabSession = loadSession('tab-b')
    const secondTabHook = renderHook(() => secondTabSession.useSessionId())

    act(() => {
      emitAppState('tab-a', 'background')
      emitAppState('tab-b', 'background')
    })
    jest.advanceTimersByTime(THIRTY_MINUTES - 1)
    act(() => emitAppState('tab-b', 'active'))
    jest.advanceTimersByTime(1)
    act(() => emitAppState('tab-a', 'active'))

    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(firstTabHook.result.current).toBe('existing-session')
    expect(secondTabHook.result.current).toBe('existing-session')
  })

  test('does not become inactive while another tab remains active', () => {
    setStoredSession('tab-a', 'existing-session', NOW.getTime())
    setStoredSession('tab-b', 'existing-session', NOW.getTime())

    const firstTabSession = loadSession('tab-a')
    const firstTabHook = renderHook(() => firstTabSession.useSessionId())
    const secondTabSession = loadSession('tab-b')
    const secondTabHook = renderHook(() => secondTabSession.useSessionId())

    act(() => emitAppState('tab-b', 'background'))
    jest.advanceTimersByTime(THIRTY_MINUTES)
    act(() => emitAppState('tab-b', 'active'))

    expect(mockUuidV4).not.toHaveBeenCalled()
    expect(firstTabHook.result.current).toBe('existing-session')
    expect(secondTabHook.result.current).toBe('existing-session')
  })
})
