import {createElement, memo} from 'react'
import {type AppStateStatus} from 'react-native'
import {act, render, renderHook} from '@testing-library/react-native'

import {type AnyAppReturn} from '#/lib/appState'
import {
  FOCUS_CHECK_AFTER,
  type NewPostsCheckTrigger,
  useNewPostsCheck,
} from './useNewPostsCheck'

/*
 * Returns and app state are driven directly rather than through a mocked
 * `AppState`: what counts as a significant return is `#/lib/appState`'s
 * business, so only its hooks are mocked.
 */
const mockReturnListeners = new Set<(appReturn: AnyAppReturn) => void>()
const mockAppStateListeners = new Set<(state: AppStateStatus) => void>()
let mockAppState: AppStateStatus = 'active'
jest.mock('#/lib/appState', () => {
  const {useEffect, useState} =
    jest.requireActual<typeof import('react')>('react')
  const {useNonReactiveCallback} = jest.requireActual<
    typeof import('#/lib/hooks/useNonReactiveCallback')
  >('#/lib/hooks/useNonReactiveCallback')
  return {
    getCurrentState: () => mockAppState,
    useAppState() {
      const [state, setState] = useState(mockAppState)
      useEffect(() => {
        mockAppStateListeners.add(setState)
        return () => {
          mockAppStateListeners.delete(setState)
        }
      }, [])
      return state
    },
    // As the real hook is, so it works in a `memo()` component.
    useOnAnyAppReturn(cb: (appReturn: AnyAppReturn) => void) {
      const onReturn = useNonReactiveCallback(cb)
      useEffect(() => {
        const listener = (appReturn: AnyAppReturn) => onReturn(appReturn)
        mockReturnListeners.add(listener)
        return () => {
          mockReturnListeners.delete(listener)
        }
      }, [onReturn])
    },
  }
})

const T0 = new Date('2026-10-02T12:00:00.000Z').getTime()
const SECOND = 1e3
const MINUTE = 60 * SECOND

type Props = Parameters<typeof useNewPostsCheck<boolean>>[0]

let lastReturnId = 0

beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(T0)
  mockAppState = 'active'
})

afterEach(() => {
  jest.useRealTimers()
})

/**
 * Renders the hook for an active, idle view of a feed whose top page was
 * fetched just now. Its check finds nothing unless told otherwise.
 */
async function setup(initial: Partial<Props> = {}) {
  const check = jest.fn<
    Promise<boolean>,
    [NewPostsCheckTrigger, {freshAt: number}]
  >(() => Promise.resolve(false))
  const onFound = jest.fn<void, [boolean, NewPostsCheckTrigger]>()
  let props: Props = {
    topFetchedAt: Date.now(),
    isEmpty: false,
    isActive: true,
    isBusy: false,
    check,
    onFound,
    ...initial,
  }
  const {rerender} = renderHook((p: Props) => useNewPostsCheck(p), {
    initialProps: props,
  })
  await flush()

  const update = async (next: Partial<Props>) => {
    props = {...props, ...next}
    rerender(props)
    await flush()
  }
  return {
    check,
    onFound,
    /** The triggers `onFound` was handed, in order. */
    found: () => onFound.mock.calls.map(([, trigger]) => trigger),
    update,
    /** Leaves this view for `away` and comes back, as switching tabs would. */
    async refocus(away = 0) {
      await update({isActive: false})
      await advance(away)
      await update({isActive: true})
    },
  }
}

/** Lets the promises that settle checks run their course. */
async function flush() {
  await act(async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve()
    }
  })
}

async function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
  await flush()
}

/** A significant return, after `away` in the background. */
function returnToApp(away: number) {
  return comeBack(away, true)
}

/** A return too quick to be significant. */
function hopToApp() {
  return comeBack(0, false)
}

async function comeBack(away: number, isSignificant: boolean) {
  await setAppState('background')
  await advance(away)
  mockAppState = 'active'
  const appReturn: AnyAppReturn = {
    id: ++lastReturnId,
    timestamp: Date.now(),
    timeAway: away,
    isSignificant,
  }
  act(() => {
    for (const listener of [...mockReturnListeners]) listener(appReturn)
    for (const listener of [...mockAppStateListeners]) listener('active')
  })
  await flush()
}

async function setAppState(state: AppStateStatus) {
  mockAppState = state
  act(() => {
    for (const listener of [...mockAppStateListeners]) listener(state)
  })
  await flush()
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return {promise, resolve, reject}
}

describe('clock', () => {
  it('is advanced by a check that finds nothing', async () => {
    const view = await setup()
    await view.refocus(FOCUS_CHECK_AFTER)
    expect(view.check).toHaveBeenCalledTimes(1)

    await view.refocus(FOCUS_CHECK_AFTER - SECOND)
    expect(view.check).toHaveBeenCalledTimes(1)
    await view.refocus(SECOND)
    expect(view.check).toHaveBeenCalledTimes(2)
  })

  it('is left alone by a check that fails', async () => {
    const view = await setup()
    view.check.mockRejectedValueOnce(new Error('Network request failed'))
    await view.refocus(FOCUS_CHECK_AFTER)
    expect(view.check).toHaveBeenCalledTimes(1)

    await view.refocus(SECOND)
    expect(view.check).toHaveBeenCalledTimes(2)
  })

  it('stops counting a check once a new top page replaces the one it checked', async () => {
    const view = await setup({topFetchedAt: T0 - 10 * MINUTE})
    expect(view.check).toHaveBeenCalledTimes(1)

    // An older top page, as a restore might commit, hasn't been checked.
    await view.update({topFetchedAt: T0 - 20 * MINUTE})
    await view.refocus(SECOND)
    expect(view.check).toHaveBeenCalledTimes(2)
  })
})

describe('focus', () => {
  it('checks once the clock is a minute old', async () => {
    const view = await setup()
    await view.refocus(FOCUS_CHECK_AFTER - SECOND)
    expect(view.check).not.toHaveBeenCalled()

    await view.refocus(SECOND)
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('checks on mount if the clock is a minute old', async () => {
    const view = await setup({topFetchedAt: T0 - FOCUS_CHECK_AFTER})
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('checks an empty feed every time, however fresh', async () => {
    const view = await setup({isEmpty: true})
    expect(view.check).toHaveBeenCalledTimes(1)
    await view.refocus()
    expect(view.check).toHaveBeenCalledTimes(2)
  })

  it('hands what it found to onFound', async () => {
    const view = await setup()
    view.check.mockResolvedValueOnce(true)
    await view.refocus(FOCUS_CHECK_AFTER)
    expect(view.onFound).toHaveBeenCalledWith(true, 'focus')
  })
})

describe('check', () => {
  it('is told what prompted it', async () => {
    const view = await setup({interval: 10 * MINUTE})
    await view.refocus(FOCUS_CHECK_AFTER)
    await returnToApp(5 * MINUTE)
    await hopToApp()
    await advance(10 * MINUTE)
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual([
      'focus',
      'return',
      'hop',
      'interval',
    ])
  })

  it('is told when the clock was set: the top page, then a successful check', async () => {
    const view = await setup()
    const fetchedAt = Date.now()
    await view.refocus(FOCUS_CHECK_AFTER)
    const checkedAt = Date.now()
    await returnToApp(5 * MINUTE)
    expect(view.check.mock.calls.map(([, {freshAt}]) => freshAt)).toEqual([
      fetchedAt,
      checkedAt,
    ])
  })
})

describe('in a memo() component', () => {
  /*
   * React 19.2 never updates a useEffectEvent there (react/react#35187), and
   * PostFeed is one.
   */
  const Checker = memo(function Checker(props: Props) {
    useNewPostsCheck(props)
    return null
  })

  it('checks a return against the latest props', async () => {
    const check = jest.fn<
      Promise<boolean>,
      [NewPostsCheckTrigger, {freshAt: number}]
    >(() => Promise.resolve(false))
    const props: Props = {
      topFetchedAt: undefined,
      isEmpty: false,
      isActive: true,
      isBusy: false,
      check,
      onFound: jest.fn(),
    }
    const {rerender} = render(createElement(Checker, props))
    await flush()

    // The feed loads after the view mounts.
    rerender(createElement(Checker, {...props, topFetchedAt: Date.now()}))
    await flush()
    await returnToApp(5 * MINUTE)

    expect(check.mock.calls.map(([trigger]) => trigger)).toEqual(['return'])
  })
})

describe('return', () => {
  it('checks on a significant return, however fresh the data', async () => {
    const view = await setup()
    view.check.mockResolvedValueOnce(true)
    await returnToApp(30 * SECOND)
    expect(view.check).toHaveBeenCalledTimes(1)
    expect(view.found()).toEqual(['return'])
  })

  it('checks on a hop, as a `hop`', async () => {
    const view = await setup()
    view.check.mockResolvedValueOnce(true)
    await hopToApp()
    expect(view.check).toHaveBeenCalledTimes(1)
    expect(view.found()).toEqual(['hop'])
  })

  it('makes one request for a return and a focus within a minute of it', async () => {
    const view = await setup()
    await returnToApp(5 * MINUTE)
    await view.refocus(30 * SECOND)
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('waits for the view to finish its work, then checks', async () => {
    const view = await setup({isBusy: true})
    view.check.mockResolvedValueOnce(true)
    await returnToApp(5 * MINUTE)
    expect(view.check).not.toHaveBeenCalled()

    await view.update({isBusy: false})
    expect(view.check).toHaveBeenCalledTimes(1)
    expect(view.found()).toEqual(['return'])
  })

  it('still checks once a refresh that held it up commits a new top', async () => {
    const view = await setup({isBusy: true})
    await returnToApp(5 * MINUTE)
    await view.update({isBusy: false, topFetchedAt: Date.now()})
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual([
      'return',
    ])
  })

  it('checks once for held-up returns, as a `return` if any was significant', async () => {
    const view = await setup({isBusy: true})
    await hopToApp()
    await returnToApp(5 * MINUTE)
    await hopToApp()
    await view.update({isBusy: false})
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual([
      'return',
    ])

    // The next one starts afresh.
    await hopToApp()
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual([
      'return',
      'hop',
    ])
  })

  it('is ignored while the view is inactive', async () => {
    const view = await setup({isActive: false})
    view.check.mockResolvedValue(true)
    await returnToApp(5 * MINUTE)
    expect(view.check).not.toHaveBeenCalled()

    // Coming back checks for the focus, not for the return.
    await view.update({isActive: true})
    expect(view.found()).toEqual(['focus'])
  })

  it('is not held for later while the view is inactive and busy', async () => {
    const view = await setup({isActive: false, isBusy: true})
    await returnToApp(5 * MINUTE)
    await view.update({isActive: true})
    await view.update({isBusy: false})
    expect(view.check).not.toHaveBeenCalled()
  })

  it('is dropped if the view becomes inactive before it is judged', async () => {
    const view = await setup({isBusy: true})
    await returnToApp(5 * MINUTE)
    await view.update({isActive: false})
    await view.update({isBusy: false})
    expect(view.check).not.toHaveBeenCalled()

    // Nor does it make a later hop significant.
    await view.update({isActive: true})
    await hopToApp()
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual([
      'focus',
      'hop',
    ])
  })

  it('is dropped if the view is left and come back to before it is judged', async () => {
    const view = await setup({isBusy: true})
    await returnToApp(5 * MINUTE)
    await view.refocus()
    await view.update({isBusy: false})
    expect(view.check).not.toHaveBeenCalled()

    // Nor does it make a later hop significant.
    await hopToApp()
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual(['hop'])
  })
})

describe('interval', () => {
  it('checks one interval after the clock', async () => {
    const view = await setup({interval: MINUTE})
    await advance(MINUTE - 1)
    expect(view.check).not.toHaveBeenCalled()
    await advance(1)
    expect(view.check).toHaveBeenCalledTimes(1)

    // The check that found nothing is the clock now.
    await advance(MINUTE - 1)
    expect(view.check).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(view.check).toHaveBeenCalledTimes(2)
  })

  it('is pushed back by a newer top page', async () => {
    const view = await setup({interval: MINUTE})
    await advance(30 * SECOND)
    await view.update({topFetchedAt: Date.now()})
    await advance(30 * SECOND)
    expect(view.check).not.toHaveBeenCalled()
    await advance(30 * SECOND)
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('waits an interval after a failed check, rather than retrying at once', async () => {
    const view = await setup({interval: MINUTE})
    view.check.mockRejectedValueOnce(new Error('Network request failed'))
    await advance(MINUTE)
    expect(view.check).toHaveBeenCalledTimes(1)
    await advance(MINUTE - 1)
    expect(view.check).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(view.check).toHaveBeenCalledTimes(2)
  })

  it('pauses while a finding stands, and resumes from a new top page', async () => {
    const view = await setup({interval: MINUTE})
    view.check.mockResolvedValueOnce(true)
    await advance(MINUTE)
    expect(view.found()).toEqual(['interval'])

    await advance(10 * MINUTE)
    expect(view.check).toHaveBeenCalledTimes(1)

    await view.update({topFetchedAt: Date.now()})
    await advance(MINUTE - 1)
    expect(view.check).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(view.check).toHaveBeenCalledTimes(2)
  })

  it('waits for the app to be in the foreground', async () => {
    const view = await setup({interval: MINUTE})
    await setAppState('inactive')
    await advance(5 * MINUTE)
    expect(view.check).not.toHaveBeenCalled()

    await setAppState('active')
    await advance(0)
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('waits for the view to finish its work', async () => {
    const view = await setup({interval: MINUTE, isBusy: true})
    await advance(5 * MINUTE)
    expect(view.check).not.toHaveBeenCalled()

    await view.update({isBusy: false})
    await advance(0)
    expect(view.check).toHaveBeenCalledTimes(1)
  })
})

describe('limits', () => {
  it('never checks from an inactive view', async () => {
    const view = await setup({
      topFetchedAt: T0 - 10 * MINUTE,
      isEmpty: true,
      isActive: false,
      interval: MINUTE,
    })
    await returnToApp(5 * MINUTE)
    await advance(10 * MINUTE)
    await view.update({isBusy: true})
    await view.update({isBusy: false})
    expect(view.check).not.toHaveBeenCalled()
  })

  it('never checks while the view is busy, as with a pending restore on mount', async () => {
    const view = await setup({topFetchedAt: T0 - 10 * MINUTE, isBusy: true})
    expect(view.check).not.toHaveBeenCalled()
  })

  it('never checks while the app is in the background, as on a launch there', async () => {
    mockAppState = 'background'
    const view = await setup({topFetchedAt: T0 - 10 * MINUTE, isEmpty: true})
    expect(view.check).not.toHaveBeenCalled()
  })

  it('never checks without a top page', async () => {
    const view = await setup({topFetchedAt: undefined, isEmpty: true})
    await returnToApp(5 * MINUTE)
    expect(view.check).not.toHaveBeenCalled()
  })

  it('runs one check at a time, and checks a return it held up once it is done', async () => {
    const response = deferred<boolean>()
    const view = await setup({
      topFetchedAt: T0 - 10 * MINUTE,
      isActive: false,
      interval: MINUTE,
    })
    view.check.mockImplementationOnce(() => response.promise)
    await view.update({isActive: true})
    expect(view.check).toHaveBeenCalledTimes(1)

    // A focus, a return and the overdue interval, all behind the one in flight.
    await view.refocus()
    await returnToApp(30 * SECOND)
    await advance(SECOND)
    expect(view.check).toHaveBeenCalledTimes(1)

    // Once it's done, the return it held up checks, even if it failed.
    view.check.mockResolvedValueOnce(true)
    response.reject(new Error('Network request failed'))
    await flush()
    expect(view.check.mock.calls.map(([trigger]) => trigger)).toEqual([
      'focus',
      'return',
    ])
    expect(view.found()).toEqual(['return'])
  })

  it('drops what a check found once a new top page replaces the one it checked', async () => {
    const response = deferred<boolean>()
    const view = await setup({interval: MINUTE})
    view.check.mockImplementationOnce(() => response.promise)
    await advance(MINUTE)
    expect(view.check).toHaveBeenCalledTimes(1)

    await view.update({topFetchedAt: Date.now()})
    response.resolve(true)
    await flush()
    expect(view.onFound).not.toHaveBeenCalled()

    // Nor does it pause the interval.
    await advance(MINUTE)
    expect(view.check).toHaveBeenCalledTimes(2)
  })
})
