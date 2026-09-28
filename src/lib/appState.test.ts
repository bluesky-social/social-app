import type * as ReactNative from 'react-native'
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

/** Walks the app through `states`, in order, as the OS would report them. */
function emit(...states: AppStateStatus[]) {
  for (const state of states) {
    mockAppState.currentState = state
    for (const cb of [...mockListeners]) cb(state)
  }
}

let cleanup: (() => void) | undefined

/*
 * The return tracker is module state that lives as long as the JS runtime, so
 * each test loads a fresh copy of the module, on the platform it asks for. The
 * testing library is loaded alongside it so that the hook renders with the same
 * copy of React. It is the `pure` entry point, which leaves cleanup to us: the
 * default one registers `afterEach` hooks, and those can't be added from inside
 * a test.
 */
function load({platform = 'ios'}: {platform?: 'ios' | 'android'} = {}) {
  const {Platform} = require('react-native') as typeof ReactNative
  jest.replaceProperty(Platform, 'OS', platform)
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
})

afterEach(() => {
  cleanup?.()
  cleanup = undefined
})

describe('onAppReturnedFromBackground', () => {
  it('fires on active -> background -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background')
    expect(cb).not.toHaveBeenCalled()

    emit('active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not fire on active -> inactive -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    // Control Center, Notification Center, a system alert, an app switcher peek
    emit('inactive', 'active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires once on active -> inactive -> background -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('inactive', 'background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires once on background -> inactive -> active', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('inactive', 'background', 'inactive', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('counts one return per background', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background', 'active')
    emit('inactive', 'active')
    expect(cb).toHaveBeenCalledTimes(1)

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('ignores the first active of a foreground launch', () => {
    mockAppState.currentState = 'inactive'
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('fires for the first listener when it is attached while backgrounded', () => {
    mockAppState.currentState = 'background'
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('fires for a later listener attached while backgrounded', () => {
    const {onAppReturnedFromBackground} = load()
    const first = jest.fn()
    onAppReturnedFromBackground(first)

    emit('inactive', 'background')
    const second = jest.fn()
    onAppReturnedFromBackground(second)

    emit('active')
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

    emit('active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('gives every listener the same return, from one app state listener', () => {
    const {onAppReturnedFromBackground} = load()
    const first: AppReturn[] = []
    const second: AppReturn[] = []
    onAppReturnedFromBackground(r => first.push(r))
    onAppReturnedFromBackground(r => second.push(r))
    expect(mockListeners.size).toBe(1)

    emit('background', 'active')
    expect(first).toHaveLength(1)
    expect(second).toHaveLength(1)
    expect(second[0]).toBe(first[0])
  })

  it('numbers returns in order and stamps them with the time', () => {
    const {onAppReturnedFromBackground} = load()
    const returns: AppReturn[] = []
    onAppReturnedFromBackground(r => returns.push(r))
    const now = jest.spyOn(Date, 'now')

    now.mockReturnValue(1_000)
    emit('background', 'active')
    now.mockReturnValue(2_000)
    emit('background', 'active')
    now.mockRestore()

    expect(returns).toEqual([
      {id: 1, timestamp: 1_000},
      {id: 2, timestamp: 2_000},
    ])
  })

  it('keeps numbering across listeners that come and go', () => {
    const {onAppReturnedFromBackground} = load()
    const first = jest.fn()
    const sub = onAppReturnedFromBackground(first)
    emit('background', 'active')
    sub.remove()

    const second = jest.fn()
    onAppReturnedFromBackground(second)
    emit('background', 'active')

    expect(first).toHaveBeenCalledWith(expect.objectContaining({id: 1}))
    expect(second).toHaveBeenCalledWith(expect.objectContaining({id: 2}))
  })

  it('stops calling a listener once it is removed', () => {
    const {onAppReturnedFromBackground} = load()
    const removed = jest.fn()
    const kept = jest.fn()
    onAppReturnedFromBackground(removed).remove()
    onAppReturnedFromBackground(kept)

    emit('background', 'active')
    expect(removed).not.toHaveBeenCalled()
    expect(kept).toHaveBeenCalledTimes(1)
  })

  it('skips a listener removed by an earlier one during the same return', () => {
    const {onAppReturnedFromBackground} = load()
    const second = jest.fn()
    onAppReturnedFromBackground(() => secondSub.remove())
    const secondSub = onAppReturnedFromBackground(second)

    emit('background', 'active')
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

    emit('background')
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
    emit('background', 'active')
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('app-initiated activities', () => {
  it('still counts a trip made outside any scope on Android', () => {
    const {onAppReturnedFromBackground} = load({platform: 'android'})
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not count a trip that starts inside a scope', () => {
    const {beginAppInitiatedActivity, onAppReturnedFromBackground} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    const end = beginAppInitiatedActivity()
    emit('background', 'active')
    end()
    expect(cb).not.toHaveBeenCalled()

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('does not let a scope ended before the trip hide it', () => {
    const {beginAppInitiatedActivity, onAppReturnedFromBackground} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    // e.g. a permission that was already granted, so no dialog opened
    beginAppInitiatedActivity()()
    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('keeps covering while any nested scope is open', () => {
    const {beginAppInitiatedActivity, onAppReturnedFromBackground} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    const endOuter = beginAppInitiatedActivity()
    const endInner = beginAppInitiatedActivity()
    endInner()
    emit('background', 'active')
    endOuter()
    expect(cb).not.toHaveBeenCalled()

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('ends the scope when the wrapped call settles', async () => {
    const {onAppReturnedFromBackground, runAppInitiatedActivity} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    const value = await runAppInitiatedActivity(() => {
      emit('background', 'active')
      return Promise.resolve('picked')
    })
    expect(value).toBe('picked')
    expect(cb).not.toHaveBeenCalled()

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('ends the scope when the wrapped call rejects', async () => {
    const {onAppReturnedFromBackground, runAppInitiatedActivity} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    await expect(
      runAppInitiatedActivity(() => Promise.reject(new Error('denied'))),
    ).rejects.toThrow('denied')

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('ends the scope when the wrapped call throws before returning', async () => {
    const {onAppReturnedFromBackground, runAppInitiatedActivity} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    await expect(
      runAppInitiatedActivity(() => {
        throw new Error('no activity')
      }),
    ).rejects.toThrow('no activity')

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('lets a trip end a scope whose call never settles', () => {
    const {onAppReturnedFromBackground, runAppInitiatedActivity} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    void runAppInitiatedActivity(() => new Promise(() => {}))
    emit('background', 'active')
    expect(cb).not.toHaveBeenCalled()

    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('lets a scope that is never ended hide at most one trip', () => {
    const {beginAppInitiatedActivity, onAppReturnedFromBackground} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    // a launch that resolves straight away, and whose scope is left to the trip
    beginAppInitiatedActivity()
    emit('background', 'active')
    emit('background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('keeps a scope opened mid-trip for the trip that follows', () => {
    const {beginAppInitiatedActivity, onAppReturnedFromBackground} = load({
      platform: 'android',
    })
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    const endPermission = beginAppInitiatedActivity()
    emit('background')
    /*
     * Android delivers the activity result before `onResume`, so the
     * permission call can settle and the picker open before the `active`.
     */
    endPermission()
    const endPicker = beginAppInitiatedActivity()
    emit('active')

    emit('background', 'active')
    endPicker()
    expect(cb).not.toHaveBeenCalled()
  })

  it('starts tracking when a scope opens', () => {
    const {beginAppInitiatedActivity, onAppReturnedFromBackground} = load({
      platform: 'android',
    })

    beginAppInitiatedActivity()
    emit('background')
    /*
     * Joining now would seed an armed latch from `background` if the scope
     * hadn't already started the tracker that saw why the app left.
     */
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('does nothing on iOS, where these flows stay inside the app', async () => {
    const {
      beginAppInitiatedActivity,
      onAppReturnedFromBackground,
      runAppInitiatedActivity,
    } = load({platform: 'ios'})
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    // pressing Home while a picker is showing
    beginAppInitiatedActivity()
    emit('inactive', 'background', 'active')
    expect(cb).toHaveBeenCalledTimes(1)

    await runAppInitiatedActivity(() => {
      emit('inactive', 'background', 'active')
      return Promise.resolve()
    })
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
