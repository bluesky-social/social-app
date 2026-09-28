import {type PropsWithChildren} from 'react'
import {
  type InfiniteData,
  InfiniteQueryObserver,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from '@tanstack/react-query'
import {act, renderHook} from '@testing-library/react-native'

import {type AppReturn} from '#/lib/appState'
import {logger} from '#/logger'
import {
  FOCUS_CHECK_AFTER,
  markPostFeedQueryChecked,
  type PostFeedCheckContext,
  type PostFeedCheckTrigger,
  RETURN_INTENT_LIFETIME,
  usePostFeedCheckTriggers,
} from './post-feed-checks'
import {refreshPostFeedQuery} from './post-feed-registry'

/*
 * Returns are driven directly rather than through a mocked `AppState`: what
 * counts as a real return is `onAppReturnedFromBackground`'s business, and
 * only its hook and the `AppReturn` it hands out are relied on here.
 */
const mockReturnListeners = new Set<(appReturn: AppReturn) => void>()
jest.mock('#/lib/appState', () => {
  const {useEffect, useEffectEvent} = jest.requireActual<{
    useEffect: (effect: () => () => void, deps: unknown[]) => void
    useEffectEvent: <T extends Function>(fn: T) => T
  }>('react')
  return {
    useOnAppReturnedFromBackground(cb: (appReturn: AppReturn) => void) {
      const onReturn = useEffectEvent(cb)
      useEffect(() => {
        const listener = (appReturn: AppReturn) => onReturn(appReturn)
        mockReturnListeners.add(listener)
        return () => {
          mockReturnListeners.delete(listener)
        }
      }, [])
    },
  }
})

const KEY = [
  'post-feed',
  'feedgen|at://did:plc:alice/app.bsky.feed.generator/cats',
  {},
]
const T0 = new Date('2026-09-29T12:00:00.000Z').getTime()
const SECOND = 1e3
const MINUTE = 60 * SECOND

type Page = {cursor: string | undefined; feed: never[]; fetchedAt: number}

let lastReturnId = 0

/** Returns to the app from the background, as every listener hears it. */
function returnFromBackground() {
  const appReturn: AppReturn = {id: ++lastReturnId, timestamp: Date.now()}
  act(() => {
    for (const listener of [...mockReturnListeners]) {
      listener(appReturn)
    }
  })
  return appReturn
}

function advance(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms)
  })
}

/** Lets the promises that settle checks and fetches run their course. */
async function flush() {
  await act(async () => {
    for (let i = 0; i < 10; i++) {
      await Promise.resolve()
    }
  })
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

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // As on the post-feed query, which keeps its exact page objects.
      queries: {gcTime: Infinity, retry: false, structuralSharing: false},
    },
  })
}

function page(fetchedAt = Date.now()): Page {
  return {cursor: 'older', feed: [], fetchedAt}
}

/** Commits a top page fetched at `fetchedAt`, as a load of the feed would. */
function seed(queryClient: QueryClient, fetchedAt = Date.now()) {
  const top = page(fetchedAt)
  queryClient.setQueryData<InfiniteData<Page>>(KEY, {
    pages: [top],
    pageParams: [undefined],
  })
  return top
}

/** Starts a fetch of the feed from the top that waits for the test. */
function startTopFetch(queryClient: QueryClient) {
  const response = deferred<Page>()
  const fetch = queryClient
    .fetchInfiniteQuery({
      queryKey: KEY,
      queryFn: () => response.promise,
      initialPageParam: undefined,
    })
    .catch(() => {})
  return {...response, fetch}
}

type Props = {isActive: boolean; isTopWorkPending?: boolean}

/**
 * Mounts a view of the feed. Each call of its check waits for the test to
 * settle it, with what the check found or `undefined` for nothing new.
 */
function renderView(
  queryClient: QueryClient,
  initialProps: Props,
  queryKey: QueryKey = KEY,
) {
  const checks: {
    context: PostFeedCheckContext
    resolve: (found: string | undefined) => void
    reject: (error: unknown) => void
  }[] = []
  const check = jest.fn(
    (context: PostFeedCheckContext) =>
      new Promise<string | undefined>((resolve, reject) => {
        checks.push({context, resolve, reject})
      }),
  )
  const onFound = jest.fn<void, [string, PostFeedCheckTrigger]>()
  const wrapper = ({children}: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const hook = renderHook(
    (props: Props) =>
      usePostFeedCheckTriggers({queryKey, check, onFound, ...props}),
    {initialProps, wrapper},
  )
  return {
    hook,
    check,
    onFound,
    triggers: () => checks.map(c => c.context.trigger),
    /** Settles the latest check. */
    settle: async (found: string | undefined) => {
      checks[checks.length - 1].resolve(found)
      await flush()
    },
    fail: async (error: unknown) => {
      checks[checks.length - 1].reject(error)
      await flush()
    },
    setProps: (props: Props) => hook.rerender(props),
    requestCheck: () => act(() => hook.result.current.requestCheck()),
  }
}

beforeEach(() => {
  jest.useFakeTimers({now: T0})
  jest.spyOn(logger, 'warn').mockImplementation(() => {})
  jest.spyOn(logger, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe('check clock', () => {
  it('lets a check that found nothing hold off focus checks for a minute', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    expect(view.triggers()).toEqual(['focus'])
    await view.settle(undefined)

    view.setProps({isActive: false})
    advance(FOCUS_CHECK_AFTER - 1)
    view.setProps({isActive: true})
    expect(view.check).toHaveBeenCalledTimes(1)

    view.setProps({isActive: false})
    advance(1)
    view.setProps({isActive: true})
    expect(view.triggers()).toEqual(['focus', 'focus'])
  })

  it('leaves the clock alone when a check fails', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    await view.fail(new Error('Bad response'))
    expect(logger.warn).toHaveBeenCalledWith('Post feed check failed', {
      trigger: 'focus',
      message: 'Error: Bad response',
    })

    view.setProps({isActive: false})
    advance(SECOND)
    view.setProps({isActive: true})
    expect(view.triggers()).toEqual(['focus', 'focus'])
  })

  it('does not log a check that failed for want of a network', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    await view.fail(new TypeError('Network request failed'))
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('counts a fetch from the top, so a fresh cold load gets no focus check', async () => {
    const queryClient = createQueryClient()
    const coldLoad = startTopFetch(queryClient)
    const view = renderView(queryClient, {isActive: true})

    advance(3 * SECOND)
    await act(async () => {
      coldLoad.resolve(page())
      await coldLoad.fetch
    })
    expect(view.check).not.toHaveBeenCalled()

    view.setProps({isActive: false})
    advance(FOCUS_CHECK_AFTER - 1)
    view.setProps({isActive: true})
    expect(view.check).not.toHaveBeenCalled()
  })

  it('counts a refresh', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * MINUTE)
    const view = renderView(queryClient, {isActive: false})

    await act(() =>
      refreshPostFeedQuery(queryClient, KEY, () =>
        Promise.resolve({page: page(), api: {} as never}),
      ),
    )
    advance(30 * SECOND)
    view.setProps({isActive: true})
    expect(view.check).not.toHaveBeenCalled()
  })

  it('stops counting a check once the top page it checked is replaced', async () => {
    const queryClient = createQueryClient()
    const top = seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    await view.settle(undefined)

    // Say a cache update rewrote the top page, keeping its old fetch time.
    act(() => {
      queryClient.setQueryData<InfiniteData<Page>>(KEY, {
        pages: [{...top}],
        pageParams: [undefined],
      })
    })
    view.setProps({isActive: false})
    advance(SECOND)
    view.setProps({isActive: true})
    expect(view.triggers()).toEqual(['focus', 'focus'])
  })
})

describe('active views', () => {
  it('never checks from a hidden or prefetched view', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * MINUTE)
    const view = renderView(queryClient, {isActive: false})

    returnFromBackground()
    view.requestCheck()
    advance(10 * MINUTE)
    returnFromBackground()
    await flush()

    expect(view.check).not.toHaveBeenCalled()
  })

  it('does not hand a hidden view what a check found', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    view.setProps({isActive: false})
    await view.settle('new posts')
    expect(view.onFound).not.toHaveBeenCalled()
  })

  it('shares the check clock between views of a query, but not their claims', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const home = renderView(queryClient, {isActive: true})
    const screen = renderView(queryClient, {isActive: true})

    returnFromBackground()
    // One check for the query, by the view that claimed the return.
    expect(home.triggers()).toEqual(['return'])
    expect(screen.check).not.toHaveBeenCalled()

    // What it finds waits for its claimant, even while another view could take it.
    home.setProps({isActive: true, isTopWorkPending: true})
    await home.settle('new posts')
    expect(screen.onFound).not.toHaveBeenCalled()
    home.setProps({isActive: true, isTopWorkPending: false})
    expect(home.onFound).toHaveBeenCalledWith('new posts', 'return')
    expect(screen.onFound).not.toHaveBeenCalled()

    // The other view is held off by the check the first one made.
    screen.setProps({isActive: false})
    advance(FOCUS_CHECK_AFTER - 1)
    screen.setProps({isActive: true})
    expect(screen.check).not.toHaveBeenCalled()
  })

  it('keeps the queries of each account apart', async () => {
    const alice = createQueryClient()
    const bob = createQueryClient()
    seed(alice)
    seed(bob)
    advance(2 * MINUTE)
    const aliceView = renderView(alice, {isActive: true})
    const bobView = renderView(bob, {isActive: false})
    await aliceView.settle(undefined)

    advance(SECOND)
    returnFromBackground()
    expect(aliceView.triggers()).toEqual(['focus', 'return'])
    await aliceView.settle(undefined)

    // Bob's view was hidden at the return, and alice's checks don't gate his.
    bobView.setProps({isActive: true})
    expect(bobView.triggers()).toEqual(['focus'])
  })
})

describe('return intent', () => {
  it('checks on a real return, past the focus gate', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})
    expect(view.check).not.toHaveBeenCalled()

    returnFromBackground()
    expect(view.triggers()).toEqual(['return'])
    await view.settle('new posts')
    expect(view.onFound).toHaveBeenCalledWith('new posts', 'return')
  })

  it('makes one request for a return and a focus within a minute of it', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})

    returnFromBackground()
    await view.settle(undefined)
    view.setProps({isActive: false})
    advance(30 * SECOND)
    view.setProps({isActive: true})

    expect(view.triggers()).toEqual(['return'])
  })

  it('makes one request for a return and a focus that were both held up', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {
      isActive: true,
      isTopWorkPending: true,
    })
    returnFromBackground()
    view.setProps({isActive: false, isTopWorkPending: true})
    view.setProps({isActive: true, isTopWorkPending: true})
    expect(view.check).not.toHaveBeenCalled()

    view.setProps({isActive: true, isTopWorkPending: false})
    expect(view.triggers()).toEqual(['return'])
    await view.settle(undefined)
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('is answered by a check already in flight when the return happens', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    expect(view.triggers()).toEqual(['focus'])

    returnFromBackground()
    advance(SECOND)
    await view.settle('new posts')

    expect(view.check).toHaveBeenCalledTimes(1)
    expect(view.onFound).toHaveBeenCalledTimes(1)
    expect(view.onFound).toHaveBeenCalledWith('new posts', 'return')
  })

  it('is answered by a cold load in flight, as after a launch in the background', async () => {
    const queryClient = createQueryClient()
    const coldLoad = startTopFetch(queryClient)
    const view = renderView(queryClient, {isActive: true})

    returnFromBackground()
    advance(SECOND)
    await act(async () => {
      coldLoad.resolve(page())
      await coldLoad.fetch
    })

    expect(view.check).not.toHaveBeenCalled()
  })

  it('stays owed until five minutes after the return', () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {
      isActive: true,
      isTopWorkPending: true,
    })
    returnFromBackground()

    advance(RETURN_INTENT_LIFETIME - 1)
    view.setProps({isActive: true, isTopWorkPending: false})
    expect(view.triggers()).toEqual(['return'])
  })

  it('expires five minutes after the return, and a later return still counts', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {
      isActive: true,
      isTopWorkPending: true,
    })
    returnFromBackground()

    advance(RETURN_INTENT_LIFETIME)
    view.setProps({isActive: true, isTopWorkPending: false})
    // What is left is the arrival, which the stale top makes worth a check.
    expect(view.triggers()).toEqual(['focus'])
    await view.settle(undefined)

    advance(SECOND)
    returnFromBackground()
    expect(view.triggers()).toEqual(['focus', 'return'])
  })

  it('hands a claim released on blur to the next view to become active', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const home = renderView(queryClient, {isActive: true})
    const screen = renderView(queryClient, {isActive: false})

    returnFromBackground()
    expect(home.triggers()).toEqual(['return'])
    // The reader moves on before the check settles.
    home.setProps({isActive: false})
    screen.setProps({isActive: true})
    expect(screen.check).not.toHaveBeenCalled()

    await home.settle('new posts')
    expect(screen.check).not.toHaveBeenCalled()
    expect(screen.onFound).toHaveBeenCalledWith('new posts', 'return')
    // Consumed there. The first view's own reaction, such as a scroll, never runs.
    expect(home.onFound).not.toHaveBeenCalled()
    home.setProps({isActive: true})
    expect(home.onFound).not.toHaveBeenCalled()
  })

  it('does not extend the return past five minutes as the claim changes hands', () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const home = renderView(queryClient, {
      isActive: true,
      isTopWorkPending: true,
    })
    const screen = renderView(queryClient, {isActive: false})
    returnFromBackground()

    advance(4 * MINUTE)
    home.setProps({isActive: false, isTopWorkPending: true})
    advance(MINUTE)
    screen.setProps({isActive: true})

    expect(screen.triggers()).toEqual(['focus'])
    expect(home.check).not.toHaveBeenCalled()
  })

  it('lets a successor check a return its claimant left unchecked', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const home = renderView(queryClient, {
      isActive: true,
      isTopWorkPending: true,
    })
    const screen = renderView(queryClient, {isActive: false})
    returnFromBackground()

    advance(4 * MINUTE)
    home.setProps({isActive: false, isTopWorkPending: true})
    advance(MINUTE - 1)
    screen.setProps({isActive: true})

    expect(screen.triggers()).toEqual(['return'])
    await screen.settle('new posts')
    expect(screen.onFound).toHaveBeenCalledWith('new posts', 'return')
  })

  it('keeps a return owed after a failed check, for the next activation to retry', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})

    returnFromBackground()
    await view.fail(new TypeError('Network request failed'))
    // Nothing retries it on its own.
    advance(MINUTE)
    await flush()
    expect(view.check).toHaveBeenCalledTimes(1)

    view.setProps({isActive: false})
    view.setProps({isActive: true})
    expect(view.triggers()).toEqual(['return', 'return'])
    await view.settle('new posts')
    expect(view.onFound).toHaveBeenCalledWith('new posts', 'return')
  })

  it('drops a check that a refresh overtook, and lets the refresh answer the return', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})
    returnFromBackground()
    const context = view.check.mock.calls[0][0]

    const top = deferred<{page: Page; api: never}>()
    let refresh: Promise<unknown>
    act(() => {
      refresh = refreshPostFeedQuery(queryClient, KEY, () => top.promise)
    })
    expect(context.isCurrent()).toBe(false)
    await view.settle('new posts')
    expect(view.onFound).not.toHaveBeenCalled()

    advance(SECOND)
    await act(async () => {
      top.resolve({page: page(), api: {} as never})
      await refresh
    })
    expect(view.check).toHaveBeenCalledTimes(1)
  })

  it('checks again once a refresh that overtook its check fails', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})
    returnFromBackground()

    const top = deferred<{page: Page; api: never}>()
    let refresh: Promise<unknown>
    act(() => {
      refresh = refreshPostFeedQuery(queryClient, KEY, () => top.promise)
    })
    await view.settle('new posts')
    expect(view.check).toHaveBeenCalledTimes(1)

    await act(async () => {
      top.reject(new TypeError('Network request failed'))
      await refresh.catch(() => {})
      await Promise.resolve()
    })
    expect(view.triggers()).toEqual(['return', 'return'])
  })
})

describe('coalescing', () => {
  it('holds a mount check for a pending restore, which then answers the return', () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * MINUTE)
    const view = renderView(queryClient, {
      isActive: true,
      isTopWorkPending: true,
    })
    returnFromBackground()
    expect(view.check).not.toHaveBeenCalled()

    // The restore's `since` fetch found nothing newer.
    advance(SECOND)
    markPostFeedQueryChecked(queryClient, KEY)
    view.setProps({isActive: true, isTopWorkPending: false})

    expect(view.check).not.toHaveBeenCalled()
  })

  it('does not check while the top is being fetched, but does while older pages load', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * MINUTE)
    const observer = new InfiniteQueryObserver<
      Page,
      Error,
      InfiniteData<Page>,
      QueryKey,
      string | undefined
    >(queryClient, {
      queryKey: KEY,
      queryFn: () => new Promise<Page>(() => {}),
      initialPageParam: undefined,
      getNextPageParam: last => last.cursor,
      getPreviousPageParam: () => 'newer',
      staleTime: Infinity,
    })
    const unsubscribe = observer.subscribe(() => {})

    act(() => {
      void observer.fetchPreviousPage()
    })
    const view = renderView(queryClient, {isActive: true})
    expect(view.check).not.toHaveBeenCalled()
    act(() => {
      void queryClient.cancelQueries({queryKey: KEY})
    })
    await flush()
    expect(view.triggers()).toEqual(['focus'])
    await view.settle(undefined)

    view.setProps({isActive: false})
    advance(FOCUS_CHECK_AFTER)
    act(() => {
      void observer.fetchNextPage()
    })
    view.setProps({isActive: true})
    expect(view.triggers()).toEqual(['focus', 'focus'])
    unsubscribe()
  })

  it('runs one check per query at a time', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})

    view.requestCheck()
    returnFromBackground()
    view.requestCheck()
    expect(view.triggers()).toEqual(['interval'])

    await view.settle('new posts')
    // Settling after the return, the interval check answered it.
    expect(view.onFound).toHaveBeenCalledWith('new posts', 'return')
    expect(view.check).toHaveBeenCalledTimes(1)
  })
})

describe('checks that never settle', () => {
  it('stop holding the query off once its top is replaced', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})
    expect(view.triggers()).toEqual(['focus'])
    view.requestCheck()
    expect(view.check).toHaveBeenCalledTimes(1)

    // The first check hangs, and a refresh replaces the top it was measuring.
    await act(() =>
      refreshPostFeedQuery(queryClient, KEY, () =>
        Promise.resolve({page: page(), api: {} as never}),
      ),
    )
    view.requestCheck()
    expect(view.triggers()).toEqual(['focus', 'interval'])
  })
})

describe('requestCheck', () => {
  it('checks an active view whenever it is asked, and a hidden one never', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})

    view.requestCheck()
    await view.settle('new posts')
    expect(view.onFound).toHaveBeenCalledWith('new posts', 'interval')
    view.requestCheck()
    expect(view.triggers()).toEqual(['interval', 'interval'])
    await view.settle(undefined)

    view.setProps({isActive: false})
    view.requestCheck()
    expect(view.check).toHaveBeenCalledTimes(2)
  })
})

describe('lifecycle', () => {
  it('drops what a check found for a query removed meanwhile', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(2 * MINUTE)
    const view = renderView(queryClient, {isActive: true})

    act(() => {
      queryClient.removeQueries({queryKey: KEY})
    })
    await view.settle('new posts')

    expect(view.onFound).not.toHaveBeenCalled()
  })

  it('contains a throw from onFound, even in a query cache listener', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const view = renderView(queryClient, {isActive: true})
    view.onFound.mockImplementation(() => {
      throw new Error('Bad render')
    })
    returnFromBackground()
    const refetch = startTopFetch(queryClient)
    await view.settle('new posts')
    expect(view.onFound).not.toHaveBeenCalled()

    const laterListener = jest.fn()
    queryClient.getQueryCache().subscribe(laterListener)
    // A failed refetch leaves the top alone, and settling hands over the finding.
    await act(async () => {
      refetch.reject(new TypeError('Network request failed'))
      await refetch.fetch
    })

    expect(view.onFound).toHaveBeenCalledWith('new posts', 'return')
    expect(logger.error).toHaveBeenCalledWith(
      'Post feed check onFound failed',
      {
        safeMessage: expect.any(Error),
      },
    )
    expect(laterListener).toHaveBeenCalledWith(
      expect.objectContaining({type: 'updated'}),
    )
  })

  it('releases its claim when it unmounts', async () => {
    const queryClient = createQueryClient()
    seed(queryClient)
    advance(10 * SECOND)
    const home = renderView(queryClient, {isActive: true})
    const screen = renderView(queryClient, {isActive: false})
    returnFromBackground()

    home.hook.unmount()
    await home.settle('new posts')
    screen.setProps({isActive: true})

    expect(screen.onFound).toHaveBeenCalledWith('new posts', 'return')
  })
})
