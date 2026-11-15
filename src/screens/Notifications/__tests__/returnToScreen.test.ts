import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import type * as TestingLibrary from '@testing-library/react-native/pure'

import {type AnyAppReturn} from '#/lib/appState'
import {type GroupedNotificationsFeed} from '#/state/queries/notifications/grouped'
import type * as ReturnToScreenModule from '#/screens/Notifications/returnToScreen'

type AppReturnListener = (appReturn: AnyAppReturn) => void
type PushListener = () => void

let mockIsFocused = true
jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => mockIsFocused,
}))

/*
 * `onAnyAppReturn`'s own timing (how long away counts as significant, etc.)
 * is `#/lib/appState`'s own concern, covered by its tests. This stands in
 * with a plain, synchronously-triggerable emitter so these tests can drive
 * `useReturnToScreen`'s reaction to a return directly.
 */
const mockAppReturnListeners = new Set<AppReturnListener>()
const mockPushListeners = new Set<PushListener>()
jest.mock('#/lib/appState', () => ({
  onAnyAppReturn: (cb: AppReturnListener) => {
    mockAppReturnListeners.add(cb)
    return {remove: () => mockAppReturnListeners.delete(cb)}
  },
}))
jest.mock('#/state/events', () => ({
  listenPushNotificationOpened: (cb: PushListener) => {
    mockPushListeners.add(cb)
    return () => mockPushListeners.delete(cb)
  },
}))

function emitAppReturn(appReturn: Partial<AnyAppReturn> = {}) {
  const full: AnyAppReturn = {
    id: 1,
    timestamp: 0,
    timeAway: 0,
    isSignificant: false,
    ...appReturn,
  }
  for (const listener of [...mockAppReturnListeners]) listener(full)
}

function emitPushOpened() {
  for (const listener of [...mockPushListeners]) listener()
}

/*
 * jest-expo's environment uses the global object as the window, without its
 * scrolling, so this stands in for it (see useWindowScrollPerPage.test.ts).
 */
let scrollY = 0
beforeEach(() => {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    get: () => scrollY,
  })
})
afterEach(() => {
  Reflect.deleteProperty(window, 'scrollY')
})

/** Load the module and hook renderer from the same React instance. */
function load() {
  const rtl =
    require('@testing-library/react-native/pure') as typeof TestingLibrary
  return {
    ...(require('#/screens/Notifications/returnToScreen') as typeof ReturnToScreenModule),
    renderHook: rtl.renderHook,
  }
}

/** Mocks `#/env` with `IS_WEB` overridden, for the rest of the current test. */
function mockIsWeb(isWeb: boolean) {
  jest.doMock('#/env', () => ({
    ...jest.requireActual<typeof import('#/env')>('#/env'),
    IS_WEB: isWeb,
  }))
}

const FEED: GroupedNotificationsFeed = 'all'

function setup({isWeb = false}: {isWeb?: boolean} = {}) {
  jest.resetModules()
  if (isWeb) mockIsWeb(true)
  const {useReturnToScreen, renderHook} = load()
  const checkLatest = jest.fn()
  const peekLatest = jest.fn()
  const scrolledDownFeeds = {current: new Set<GroupedNotificationsFeed>()}
  const activeFeed = {current: FEED}
  const hook = renderHook(() =>
    useReturnToScreen({
      activeFeed,
      checkLatest,
      peekLatest,
      scrolledDownFeeds,
    }),
  )
  return {hook, checkLatest, peekLatest, scrolledDownFeeds, activeFeed}
}

beforeEach(() => {
  mockIsFocused = true
  mockAppReturnListeners.clear()
  mockPushListeners.clear()
  scrollY = 0
  // Controls requestAnimationFrame, which is a setTimeout-based polyfill here
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
  jest.dontMock('#/env')
})

describe('useReturnToScreen on mount/focus', () => {
  it('checks the tab in view straight away on native', () => {
    const {checkLatest} = setup()
    expect(checkLatest).toHaveBeenCalledTimes(1)
    expect(checkLatest).toHaveBeenCalledWith(FEED, 'focus')
  })

  it("doesn't check again while focus doesn't change", () => {
    const {hook, checkLatest} = setup()
    hook.rerender(undefined)
    hook.rerender(undefined)
    expect(checkLatest).toHaveBeenCalledTimes(1)
  })

  it('checks again each time the screen regains focus', () => {
    mockIsFocused = false
    const {hook, checkLatest} = setup()
    expect(checkLatest).not.toHaveBeenCalled()

    mockIsFocused = true
    hook.rerender(undefined)
    mockIsFocused = false
    hook.rerender(undefined)
    mockIsFocused = true
    hook.rerender(undefined)

    expect(checkLatest).toHaveBeenCalledTimes(2)
  })
})

describe('useReturnToScreen on web, focusing the screen', () => {
  it("doesn't check the tab in view until the window position has settled", () => {
    const {checkLatest} = setup({isWeb: true})
    expect(checkLatest).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()
    expect(checkLatest).not.toHaveBeenCalled()
    jest.runOnlyPendingTimers()
    expect(checkLatest).toHaveBeenCalledTimes(1)
  })

  it('refreshes when the restored position is near the top, as v1 did', () => {
    scrollY = 200 // not "> 200", so not scrolled down
    const {checkLatest, scrolledDownFeeds} = setup({isWeb: true})
    jest.runOnlyPendingTimers()
    jest.runOnlyPendingTimers()

    expect(checkLatest).toHaveBeenCalledWith(FEED, 'focus', {
      isScrolledDown: false,
    })
    expect(scrolledDownFeeds.current.has(FEED)).toBe(false)
  })

  it('peeks instead when the restored position is scrolled down', () => {
    scrollY = 201
    const {checkLatest, scrolledDownFeeds} = setup({isWeb: true})
    jest.runOnlyPendingTimers()
    jest.runOnlyPendingTimers()

    expect(checkLatest).toHaveBeenCalledWith(FEED, 'focus', {
      isScrolledDown: true,
    })
    expect(scrolledDownFeeds.current.has(FEED)).toBe(true)
  })

  it(
    "reads the position after scroll restoration's own " +
      'requestAnimationFrame, not before it',
    () => {
      // The previous screen's position, still in place when this effect runs
      scrollY = 999
      const {checkLatest} = setup({isWeb: true})

      /*
       * Mimics useWebScrollRestoration's `focus` listener: scheduled from
       * the navigator, so strictly after this hook's own effect above (React
       * fires child effects, like this screen's, before parent ones, like
       * the navigator's). A real restoration also only takes effect on the
       * frame it runs, same as this.
       */
      requestAnimationFrame(() => {
        scrollY = 100
      })

      // First frame: this hook's own (outer) rAF runs, then the listener
      // above, registered after it, applies the restored position.
      jest.runOnlyPendingTimers()
      expect(checkLatest).not.toHaveBeenCalled()

      // Second frame: this hook's nested (inner) rAF now sees it.
      jest.runOnlyPendingTimers()
      expect(checkLatest).toHaveBeenCalledWith(FEED, 'focus', {
        isScrolledDown: false,
      })
    },
  )

  it('handles a remount the same way, with scrolledDownFeeds starting empty', () => {
    // As after being popped off the stack, or WEB_MAX_CACHED_SCREENS eviction
    scrollY = 500
    const {checkLatest, scrolledDownFeeds} = setup({isWeb: true})
    expect(scrolledDownFeeds.current.size).toBe(0)

    jest.runOnlyPendingTimers()
    jest.runOnlyPendingTimers()

    // Peeks, not refreshes, despite scrolledDownFeeds saying nothing yet
    expect(checkLatest).toHaveBeenCalledWith(FEED, 'focus', {
      isScrolledDown: true,
    })
  })
})

describe('useReturnToScreen on an app/tab return', () => {
  it('peeks a quick return on native, without checking the tab in view', () => {
    const {checkLatest, peekLatest} = setup()
    checkLatest.mockClear() // the mount's own check

    emitAppReturn({isSignificant: false})

    expect(peekLatest).toHaveBeenCalledWith(FEED)
    expect(checkLatest).not.toHaveBeenCalled()
  })

  it('checks the tab in view on a significant return on native', () => {
    const {checkLatest, peekLatest} = setup()
    checkLatest.mockClear()

    emitAppReturn({isSignificant: true})

    expect(checkLatest).toHaveBeenCalledWith(FEED, 'significantReturn')
    expect(peekLatest).not.toHaveBeenCalled()
  })

  it("ignores a significant return while the screen isn't focused, on native", () => {
    const {hook, checkLatest, peekLatest} = setup()
    checkLatest.mockClear()
    mockIsFocused = false
    hook.rerender(undefined) // picks up the new isFocused, as a real blur would

    emitAppReturn({isSignificant: true})

    expect(checkLatest).not.toHaveBeenCalled()
    expect(peekLatest).not.toHaveBeenCalled()
  })

  it('only ever peeks on web, however long the return was away', () => {
    const {checkLatest, peekLatest} = setup({isWeb: true})
    jest.runAllTimers() // settle the mount's own focus check
    checkLatest.mockClear()
    peekLatest.mockClear()

    emitAppReturn({isSignificant: false})
    expect(peekLatest).toHaveBeenCalledWith(FEED)
    expect(checkLatest).not.toHaveBeenCalled()

    peekLatest.mockClear()
    emitAppReturn({isSignificant: true})
    expect(peekLatest).toHaveBeenCalledWith(FEED)
    expect(checkLatest).not.toHaveBeenCalled()
  })

  it("ignores a return while the screen isn't focused, on web", () => {
    const {hook, checkLatest, peekLatest} = setup({isWeb: true})
    jest.runAllTimers()
    checkLatest.mockClear()
    peekLatest.mockClear()
    mockIsFocused = false
    hook.rerender(undefined)

    emitAppReturn({isSignificant: true})

    expect(checkLatest).not.toHaveBeenCalled()
    expect(peekLatest).not.toHaveBeenCalled()
  })
})

describe('useReturnToScreen opening a push', () => {
  it('checks the tab in view while focused, on native', () => {
    const {checkLatest} = setup()
    checkLatest.mockClear()

    emitPushOpened()

    expect(checkLatest).toHaveBeenCalledWith(FEED, 'pushOpened')
  })

  it('checks the tab in view while focused, on web too', () => {
    const {checkLatest} = setup({isWeb: true})
    checkLatest.mockClear()

    emitPushOpened()

    expect(checkLatest).toHaveBeenCalledWith(FEED, 'pushOpened')
  })

  it("is ignored while the screen isn't focused", () => {
    const {hook, checkLatest} = setup()
    checkLatest.mockClear()
    mockIsFocused = false
    hook.rerender(undefined)

    emitPushOpened()

    expect(checkLatest).not.toHaveBeenCalled()
  })
})
