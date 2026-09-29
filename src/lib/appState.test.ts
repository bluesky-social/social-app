import {type AppStateStatus} from 'react-native'
import type * as TestingLibrary from '@testing-library/react-native/pure'

import type * as AppStateModule from '#/lib/appState'

type AppReturn = AppStateModule.AppReturn
type AppStateListener = (state: AppStateStatus) => void

const mockListeners = new Set<AppStateListener>()

/*
 * The real `AppState` is a `NativeEventEmitter` over a native module nothing
 * here can drive, so it is replaced with a fake that records subscribers and
 * lets a test walk the app through a sequence of states. It lives out here
 * because a `jest.mock` factory may only reference `mock`-prefixed names.
 */
const mockAppState = {
  currentState: 'active' as AppStateStatus,
  addEventListener(_type: string, cb: AppStateListener) {
    mockListeners.add(cb)
    return {remove: () => mockListeners.delete(cb)}
  },
}

/*
 * Reached through a getter so that the module is safe to require before this
 * file's own bindings are initialised.
 */
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  get default() {
    return mockAppState
  },
}))

/** Long enough away for coming back to count as a return on any platform. */
const AWAY = 5 * 60 * 1000

let mockNow = 0

/**
 * Walks the app through `steps`, in order, as the OS would report them. A
 * number is time passing, in milliseconds, before the next state.
 */
function emit(...steps: (AppStateStatus | number)[]) {
  for (const step of steps) {
    if (typeof step === 'number') {
      mockNow += step
      continue
    }
    mockAppState.currentState = step
    for (const cb of [...mockListeners]) cb(step)
  }
}

let cleanup: (() => void) | undefined

/*
 * The return tracker is module state that lives as long as the JS runtime, so
 * each test loads a fresh copy of the module. The testing library is loaded
 * alongside it so that the hook renders with the same copy of React. It is the
 * `pure` entry point, which leaves cleanup to us: the default one registers
 * `afterEach` hooks, and those can't be added from inside a test.
 */
function load() {
  const rtl =
    require('@testing-library/react-native/pure') as typeof TestingLibrary
  cleanup = rtl.cleanup
  return {
    ...(require('#/lib/appState') as typeof AppStateModule),
    renderHook: rtl.renderHook,
  }
}

beforeEach(() => {
  jest.resetModules()
  mockListeners.clear()
  mockAppState.currentState = 'active'
  mockNow = 0
  jest.spyOn(Date, 'now').mockImplementation(() => mockNow)
})

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  jest.restoreAllMocks()
})

describe('onAppReturnedFromBackground', () => {
  it('fires on active -> background -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background', AWAY)
    expect(cb).not.toHaveBeenCalled()

    emit('active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire when the app comes back sooner than five minutes', () => {
    const {onAppReturnedFromBackground, RETURN_MIN_TIME_AWAY} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    // e.g. the photo picker, share sheet or fullscreen video on Android
    emit('background', RETURN_MIN_TIME_AWAY - 1, 'active')
    expect(cb).not.toHaveBeenCalled()

    emit('background', RETURN_MIN_TIME_AWAY, 'active')
    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith(expect.objectContaining({id: 1}))
  })

  it('measures time away from the first background of a trip', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background', AWAY / 2, 'inactive', AWAY / 2, 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire on active -> inactive -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    // Control Center, Notification Center, a system alert, an app switcher peek
    emit('inactive', AWAY, 'active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires once on active -> inactive -> background -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('inactive', 'background', AWAY, 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires once on background -> inactive -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('inactive', 'background', AWAY, 'inactive', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('counts one return per background', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background', AWAY, 'active')
    emit('inactive', AWAY, 'active')
    expect(cb).toHaveBeenCalledTimes(1)

    emit('background', AWAY, 'active')
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('ignores the first active of a foreground launch', () => {
    mockAppState.currentState = 'inactive'
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit(AWAY, 'active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires for the first listener when it is attached while backgrounded', () => {
    mockAppState.currentState = 'background'
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit(AWAY, 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('counts time away from when tracking started in the background', () => {
    mockAppState.currentState = 'background'
    const {onAppReturnedFromBackground, RETURN_MIN_TIME_AWAY} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit(RETURN_MIN_TIME_AWAY - 1, 'active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('needs half a minute away on iOS and a minute elsewhere', () => {
    expect(load().RETURN_MIN_TIME_AWAY).toBe(30 * 1000)

    jest.resetModules()
    jest.doMock('#/env', () => ({
      ...jest.requireActual('#/env'),
      IS_IOS: false,
      IS_ANDROID: true,
    }))
    const android = load()
    expect(android.RETURN_MIN_TIME_AWAY).toBe(60 * 1000)

    // an Android photo picker or share sheet trip
    const cb = jest.fn()
    android.onAppReturnedFromBackground(cb)
    emit('background', 30 * 1000, 'active')
    expect(cb).not.toHaveBeenCalled()
    jest.dontMock('#/env')
  })

  it('fires for a later listener attached while backgrounded', () => {
    const {onAppReturnedFromBackground} = load()
    const first = jest.fn()
    onAppReturnedFromBackground(first)

    emit('inactive', 'background')
    const second = jest.fn()
    onAppReturnedFromBackground(second)

    emit(AWAY, 'active')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('fires for a listener attached between background and active', () => {
    const {onAppReturnedFromBackground} = load()
    onAppReturnedFromBackground(jest.fn()).remove()

    /*
     * Seeding a latch of its own from `inactive` would lose this return, so
     * the listener has to join the one that saw the `background`.
     */
    emit('background', 'inactive')
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit(AWAY, 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('gives every listener the same return, from one app state listener', () => {
    const {onAppReturnedFromBackground} = load()
    const first: AppReturn[] = []
    const second: AppReturn[] = []
    onAppReturnedFromBackground(r => first.push(r))
    onAppReturnedFromBackground(r => second.push(r))
    expect(mockListeners.size).toBe(1)

    emit('background', AWAY, 'active')
    expect(first).toHaveLength(1)
    expect(second).toHaveLength(1)
    expect(second[0]).toBe(first[0])
  })

  it('numbers returns in order and stamps them with the time', () => {
    const {onAppReturnedFromBackground} = load()
    const returns: AppReturn[] = []
    onAppReturnedFromBackground(r => returns.push(r))

    emit('background', AWAY, 'active')
    emit(1_000, 'background', AWAY, 'active')

    expect(returns).toEqual([
      {id: 1, timestamp: AWAY},
      {id: 2, timestamp: 2 * AWAY + 1_000},
    ])
  })

  it('keeps numbering across listeners that come and go', () => {
    const {onAppReturnedFromBackground} = load()
    const first = jest.fn()
    const sub = onAppReturnedFromBackground(first)
    emit('background', AWAY, 'active')
    sub.remove()

    const second = jest.fn()
    onAppReturnedFromBackground(second)
    emit('background', AWAY, 'active')

    expect(first).toHaveBeenCalledWith(expect.objectContaining({id: 1}))
    expect(second).toHaveBeenCalledWith(expect.objectContaining({id: 2}))
  })

  it('stops calling a listener once it is removed', () => {
    const {onAppReturnedFromBackground} = load()
    const removed = jest.fn()
    const kept = jest.fn()
    onAppReturnedFromBackground(removed).remove()
    onAppReturnedFromBackground(kept)

    emit('background', AWAY, 'active')
    expect(removed).not.toHaveBeenCalled()
    expect(kept).toHaveBeenCalledTimes(1)
  })

  it('skips a listener removed by an earlier one during the same return', () => {
    const {onAppReturnedFromBackground} = load()
    const second = jest.fn()
    onAppReturnedFromBackground(() => secondSub.remove())
    const secondSub = onAppReturnedFromBackground(second)

    emit('background', AWAY, 'active')
    expect(second).not.toHaveBeenCalled()
  })
})

describe('useOnAppReturnedFromBackground', () => {
  it('calls the callback it was last rendered with', () => {
    const {renderHook, useOnAppReturnedFromBackground} = load()
    const first = jest.fn()
    const second = jest.fn()
    const {rerender} = renderHook(
      ({cb}: {cb: (appReturn: AppReturn) => void}) =>
        useOnAppReturnedFromBackground(cb),
      {initialProps: {cb: first}},
    )

    emit('background', AWAY)
    rerender({cb: second})

    emit('active')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledWith(expect.objectContaining({id: 1}))
  })

  it('stops on unmount', () => {
    const {renderHook, useOnAppReturnedFromBackground} = load()
    const cb = jest.fn()
    const {unmount} = renderHook(() => useOnAppReturnedFromBackground(cb))

    unmount()
    emit('background', AWAY, 'active')
    expect(cb).not.toHaveBeenCalled()
  })
})
