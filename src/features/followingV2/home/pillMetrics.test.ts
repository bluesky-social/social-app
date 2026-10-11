import {act, renderHook} from '@testing-library/react-native'

import {
  prependPillGoneReason,
  prependPillPresentation,
  usePrependPillMetrics,
} from './pillMetrics'

/**
 * What the hook subscribes to significant returns with, for tests to report
 * one.
 */
const mockReturnListeners = new Set<() => void>()
jest.mock('#/lib/appState', () => {
  const {useEffect} = jest.requireActual<{
    useEffect: (effect: () => () => void, deps: unknown[]) => void
  }>('react')
  const {useNonReactiveCallback} = jest.requireActual<{
    useNonReactiveCallback: <F extends () => void>(fn: F) => F
  }>('#/lib/hooks/useNonReactiveCallback')
  return {
    useOnAppReturnedFromBackground(cb: () => void) {
      const onReturn = useNonReactiveCallback(cb)
      useEffect(() => {
        const listener = () => onReturn()
        mockReturnListeners.add(listener)
        return () => {
          mockReturnListeners.delete(listener)
        }
      }, [onReturn])
    },
  }
})

function significantReturn() {
  act(() => {
    for (const listener of [...mockReturnListeners]) listener()
  })
}

describe('prependPillPresentation', () => {
  it('is a facepile from four posts with a face, as the pill draws it', () => {
    expect(prependPillPresentation(4, 1)).toBe('facepile')
    expect(prependPillPresentation(3, 3)).toBe('generic')
    expect(prependPillPresentation(10, 0)).toBe('generic')
  })
})

describe('prependPillGoneReason', () => {
  it('is replaced once a page fetched from the top since it went up is on top', () => {
    expect(prependPillGoneReason({fetchedAt: 2}, 1)).toBe('replaced')
    expect(prependPillGoneReason({fetchedAt: 2, since: 's'}, 1)).toBe('gone')
    expect(prependPillGoneReason({fetchedAt: 0}, 1)).toBe('gone')
    expect(prependPillGoneReason({}, 1)).toBe('gone')
  })
})

describe('usePrependPillMetrics', () => {
  type Props = Parameters<typeof usePrependPillMetrics>[0]
  const T0 = new Date('2026-10-11T12:00:00.000Z').getTime()
  const DOWN = {isUp: false, visible: false, count: 0, authors: []}
  const UP = {isUp: true, visible: true, count: 2, authors: []}

  function setup(initial: Partial<Props> = {}) {
    const metric = jest.fn()
    const dismiss = jest.fn()
    const onPress = jest.fn()
    let props: Props = {
      enabled: true,
      metric,
      isActive: true,
      top: {fetchedAt: T0, since: 'since'},
      pill: {...DOWN, dismiss, onPress},
      ...initial,
    }
    const hook = renderHook((p: Props) => usePrependPillMetrics(p), {
      initialProps: props,
    })
    const update = (
      next: Omit<Partial<Props>, 'pill'> & {pill?: Partial<Props['pill']>},
    ) => {
      props = {...props, ...next, pill: {...props.pill, ...next.pill}}
      hook.rerender(props)
    }
    const reported = () =>
      metric.mock.calls.map(([event, payload]) => [event, payload])
    return {hook, metric, dismiss, onPress, update, reported}
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(T0)
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('reports one impression per offer, from a restore, and why it came down', () => {
    const {hook, dismiss, update, reported} = setup()

    update({pill: UP})
    update({pill: {count: 3}})
    jest.advanceTimersByTime(5000)
    act(() => hook.result.current.dismiss())
    update({pill: DOWN})

    expect(dismiss).toHaveBeenCalled()
    expect(reported()).toEqual([
      [
        'followingV2:pill:impression',
        {
          surface: 'homeFollowing',
          source: 'restore',
          count: 2,
          presentation: 'generic',
        },
      ],
      [
        'followingV2:pill:hide',
        {
          surface: 'homeFollowing',
          source: 'restore',
          reason: 'reachedTop',
          count: 3,
          shownMs: 5000,
        },
      ],
    ])
  })

  it('reports a press, and comes down as pressed', () => {
    const {hook, onPress, update, reported} = setup()
    update({pill: UP})
    jest.advanceTimersByTime(1000)

    act(() => hook.result.current.onPress())
    act(() => hook.result.current.dismiss())
    update({pill: DOWN})

    expect(onPress).toHaveBeenCalled()
    expect(reported().slice(1)).toEqual([
      [
        'followingV2:pill:press',
        {
          surface: 'homeFollowing',
          source: 'restore',
          count: 2,
          presentation: 'generic',
          shownMs: 1000,
        },
      ],
      [
        'followingV2:pill:hide',
        expect.objectContaining({reason: 'pressed', shownMs: 1000}),
      ],
    ])
  })

  it('tells a refresh that replaced the feed from posts that went', () => {
    const {update, reported} = setup()
    update({pill: UP})
    jest.advanceTimersByTime(1000)
    update({pill: DOWN, top: {fetchedAt: Date.now()}})

    // Posts staged above the refreshed feed, then muted away.
    jest.advanceTimersByTime(1000)
    update({pill: UP, top: {fetchedAt: Date.now(), since: 'refreshed'}})
    update({pill: DOWN})

    expect(
      reported()
        .filter(([event]) => event === 'followingV2:pill:hide')
        .map(([, payload]) => (payload as {reason: string}).reason),
    ).toEqual(['replaced', 'gone'])
  })

  it('reports an offer only once it shows, as the view becomes active', () => {
    const {update, reported} = setup({isActive: false})
    update({pill: {...UP, visible: false}})
    expect(reported()).toEqual([])

    update({isActive: true, pill: {visible: true}})

    expect(reported()).toEqual([
      ['followingV2:pill:impression', expect.objectContaining({count: 2})],
    ])
  })

  it('reports nothing for an offer that comes down unseen', () => {
    const {update, reported} = setup({isActive: false})
    update({pill: {...UP, visible: false}})
    update({pill: DOWN})

    expect(reported()).toEqual([])
  })

  it('reports offers after a significant return while active as from the return', () => {
    const {update, reported} = setup({isActive: false})
    // Away from Home, a return doesn't offer anything there.
    significantReturn()
    update({isActive: true, pill: UP})
    update({pill: DOWN})
    significantReturn()
    update({pill: UP})

    expect(
      reported()
        .filter(([event]) => event === 'followingV2:pill:impression')
        .map(([, payload]) => (payload as {source: string}).source),
    ).toEqual(['restore', 'return'])
  })

  it('reports nothing while disabled, and passes presses on', () => {
    const {hook, onPress, update, reported} = setup({enabled: false})
    update({pill: UP})
    act(() => hook.result.current.onPress())
    update({pill: DOWN})

    expect(onPress).toHaveBeenCalled()
    expect(reported()).toEqual([])
  })
})
