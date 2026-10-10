import {type createElement, type memo} from 'react'
import {type AppStateStatus} from 'react-native'
import type * as TestingLibrary from '@testing-library/react-native/pure'

import type * as AppStateModule from '#/lib/appState'

type AppReturn = AppStateModule.AppReturn
type AppStateListener = (state: AppStateStatus) => void

const mockListeners = new Set<AppStateListener>()
const mockAppState = {
  currentState: 'active' as AppStateStatus,
  addEventListener(_type: string, cb: AppStateListener) {
    mockListeners.add(cb)
    return {remove: () => mockListeners.delete(cb)}
  },
}

/* Delay accessing the fake until after Jest's hoisted mock is initialized. */
jest.mock('react-native/Libraries/AppState/AppState', () => ({
  __esModule: true,
  get default() {
    return mockAppState
  },
}))

const AWAY = 5 * 60 * 1000
let mockNow = 0

/** Numeric steps advance the clock; statuses emit AppState changes. */
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

/** Load the module and hook renderer from the same React instance. */
function load() {
  const rtl =
    require('@testing-library/react-native/pure') as typeof TestingLibrary
  cleanup = rtl.cleanup
  return {
    ...(require('#/lib/appState') as typeof AppStateModule),
    React: require('react') as {
      createElement: typeof createElement
      memo: typeof memo
    },
    render: rtl.render,
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
  jest.dontMock('#/env')
})

describe('onAppReturnedFromBackground', () => {
  it('only fires after the minimum time away', () => {
    const {onAppReturnedFromBackground, RETURN_MIN_TIME_AWAY} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('background', RETURN_MIN_TIME_AWAY - 1, 'active')
    expect(cb).not.toHaveBeenCalled()

    emit('background', RETURN_MIN_TIME_AWAY, 'active')
    expect(cb).toHaveBeenCalledWith({
      id: 1,
      timestamp: 2 * RETURN_MIN_TIME_AWAY - 1,
    })
  })

  it('ignores a foreground launch and inactive-only interruptions', () => {
    mockAppState.currentState = 'inactive'
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit(AWAY, 'active', 'inactive', AWAY, 'active')
    expect(cb).not.toHaveBeenCalled()
  })

  it('measures from background even when inactive follows', () => {
    const {onAppReturnedFromBackground} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit('inactive', 'background', AWAY / 2, 'inactive', AWAY / 2, 'active')
    expect(cb).toHaveBeenCalledWith({id: 1, timestamp: AWAY})
  })

  it('uses a longer cutoff on Android', () => {
    expect(load().RETURN_MIN_TIME_AWAY).toBe(30_000)

    jest.resetModules()
    jest.doMock('#/env', () => ({
      ...jest.requireActual('#/env'),
      IS_IOS: false,
    }))
    const {onAppReturnedFromBackground, RETURN_MIN_TIME_AWAY} = load()
    expect(RETURN_MIN_TIME_AWAY).toBe(60_000)

    const cb = jest.fn()
    onAppReturnedFromBackground(cb)
    emit('background', 30_000, 'active')
    expect(cb).not.toHaveBeenCalled()
    emit('background', 60_000, 'active')
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('starts tracking when first subscribed while backgrounded', () => {
    mockAppState.currentState = 'background'
    const {onAppReturnedFromBackground, RETURN_MIN_TIME_AWAY} = load()
    const cb = jest.fn()
    onAppReturnedFromBackground(cb)

    emit(RETURN_MIN_TIME_AWAY - 1, 'active')
    expect(cb).not.toHaveBeenCalled()

    emit('background', RETURN_MIN_TIME_AWAY, 'active')
    expect(cb).toHaveBeenCalledWith({
      id: 1,
      timestamp: 2 * RETURN_MIN_TIME_AWAY - 1,
    })
  })

  it('keeps tracking when listeners come and go', () => {
    const {onAppReturnedFromBackground} = load()
    const first = jest.fn()
    onAppReturnedFromBackground(first).remove()

    emit('background', 'inactive')
    const second = jest.fn()
    const sub = onAppReturnedFromBackground(second)
    emit(AWAY, 'active')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({id: 1, timestamp: AWAY})

    sub.remove()
    emit('background', AWAY, 'active')
    expect(second).toHaveBeenCalledTimes(1)

    const third = jest.fn()
    onAppReturnedFromBackground(third)
    emit('background', AWAY, 'active')
    expect(third).toHaveBeenCalledWith({id: 3, timestamp: 3 * AWAY})
  })

  it('shares each return and numbers consecutive returns', () => {
    const {onAppReturnedFromBackground} = load()
    const first: AppReturn[] = []
    const second: AppReturn[] = []
    onAppReturnedFromBackground(r => first.push(r))
    onAppReturnedFromBackground(r => second.push(r))
    expect(mockListeners.size).toBe(1)

    emit('background', AWAY, 'active')
    emit(1_000, 'background', AWAY, 'active')
    expect(first).toEqual([
      {id: 1, timestamp: AWAY},
      {id: 2, timestamp: 2 * AWAY + 1_000},
    ])
    expect(second[0]).toBe(first[0])
    expect(second[1]).toBe(first[1])
  })

  it('skips a listener removed during the same return', () => {
    const {onAppReturnedFromBackground} = load()
    const second = jest.fn()
    onAppReturnedFromBackground(() => secondSub.remove())
    const secondSub = onAppReturnedFromBackground(second)

    emit('background', AWAY, 'active')
    expect(second).not.toHaveBeenCalled()
  })
})

describe('useOnAppReturnedFromBackground', () => {
  it('uses the latest callback and stops on unmount', () => {
    const {renderHook, useOnAppReturnedFromBackground} = load()
    const first = jest.fn()
    const second = jest.fn()
    const {rerender, unmount} = renderHook(
      ({cb}: {cb: (appReturn: AppReturn) => void}) =>
        useOnAppReturnedFromBackground(cb),
      {initialProps: {cb: first}},
    )

    emit('background', AWAY)
    rerender({cb: second})
    emit('active')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({id: 1, timestamp: AWAY})

    unmount()
    emit('background', AWAY, 'active')
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('uses the latest callback in a memo() component', () => {
    // React 19.2 never updates a useEffectEvent there (react/react#35187).
    const {React, render, useOnAppReturnedFromBackground} = load()
    const Listener = React.memo(function Listener({
      cb,
    }: {
      cb: (appReturn: AppReturn) => void
    }) {
      useOnAppReturnedFromBackground(cb)
      return null
    })
    const first = jest.fn()
    const second = jest.fn()
    const {rerender} = render(React.createElement(Listener, {cb: first}))

    rerender(React.createElement(Listener, {cb: second}))
    emit('background', AWAY, 'active')

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })
})
