import {afterEach, beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'

import {
  IMPRESSION_DELAY_MS,
  refreshPillHideReason,
  useRefreshPillMetrics,
} from '#/screens/Notifications/refreshPillMetrics'

/**
 * The app state the hook reads, for tests to send the app to the background.
 */
let mockAppState = 'active'
jest.mock('#/lib/appState', () => ({
  useAppState: () => mockAppState,
}))

describe('refreshPillHideReason', () => {
  const SHOWN_TOP = 1000

  it('is left once the tab is out of view, whatever else happened', () => {
    expect(
      refreshPillHideReason({
        isInView: false,
        isFetchingTop: true,
        topRequestedAt: SHOWN_TOP + 1,
        shownTopRequestedAt: SHOWN_TOP,
      }),
    ).toBe('left')
  })

  it('is refreshed while the tab fetches its top, or once a newer top is in', () => {
    expect(
      refreshPillHideReason({
        isInView: true,
        isFetchingTop: true,
        topRequestedAt: SHOWN_TOP,
        shownTopRequestedAt: SHOWN_TOP,
      }),
    ).toBe('refreshed')
    expect(
      refreshPillHideReason({
        isInView: true,
        isFetchingTop: false,
        topRequestedAt: SHOWN_TOP + 1,
        shownTopRequestedAt: SHOWN_TOP,
      }),
    ).toBe('refreshed')
  })

  it('is gone when the tab still has the top it showed over, or none', () => {
    expect(
      refreshPillHideReason({
        isInView: true,
        isFetchingTop: false,
        topRequestedAt: SHOWN_TOP,
        shownTopRequestedAt: SHOWN_TOP,
      }),
    ).toBe('gone')
    expect(
      refreshPillHideReason({
        isInView: true,
        isFetchingTop: false,
        topRequestedAt: undefined,
        shownTopRequestedAt: SHOWN_TOP,
      }),
    ).toBe('gone')
  })
})

describe('useRefreshPillMetrics', () => {
  type Props = Parameters<typeof useRefreshPillMetrics>[0]
  const T0 = new Date('2026-10-12T12:00:00.000Z').getTime()
  const TOP = {requestedAt: T0 - 60_000}
  const SHOWN = {isInView: true, visible: true}
  const HIDDEN = {isInView: true, visible: false}

  function setup(initial: Partial<Props> = {}) {
    const metric = jest.fn()
    const onPress = jest.fn()
    let props: Props = {
      metric,
      tab: 'all',
      isInView: true,
      visible: false,
      top: TOP,
      isFetchingTop: false,
      onPress,
      ...initial,
    }
    const hook = renderHook((p: Props) => useRefreshPillMetrics(p), {
      initialProps: props,
    })
    const update = (next: Partial<Props>) => {
      props = {...props, ...next}
      hook.rerender(props)
    }
    const press = () => act(() => hook.result.current())
    const reported = () =>
      metric.mock.calls.map(([event, payload]) => [event, payload])
    return {hook, onPress, update, press, reported}
  }

  beforeEach(() => {
    mockAppState = 'active'
    jest.useFakeTimers()
    jest.setSystemTime(T0)
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('reports an impression as it shows, and a press and hide when pressed', () => {
    const {onPress, update, press, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(2000)
    press()
    jest.advanceTimersByTime(500)
    update({...HIDDEN, isFetchingTop: true})

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      ['notifications:refreshPill:press', {tab: 'all', shownMs: 2000}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'pressed', shownMs: 2500},
      ],
    ])
  })

  it('says the tab was refreshed when it loads its top some other way', () => {
    const {update, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(1000)
    update({...HIDDEN, isFetchingTop: true})

    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'refreshed', shownMs: 1000},
      ],
    ])
  })

  it('says it was gone when a check takes it down', () => {
    const {update, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(1000)
    update(HIDDEN)

    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'gone', shownMs: 1000},
      ],
    ])
  })

  it("doesn't count one that goes straight away, e.g. as the app comes back and refreshes", () => {
    const {update, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(IMPRESSION_DELAY_MS - 1)
    update({...HIDDEN, isFetchingTop: true})
    jest.advanceTimersByTime(1000)

    expect(reported()).toEqual([])
  })

  it('counts one pressed before it would have counted', () => {
    const {onPress, update, press, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(100)
    press()
    update({...HIDDEN, isFetchingTop: true})
    jest.advanceTimersByTime(1000)

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      ['notifications:refreshPill:press', {tab: 'all', shownMs: 100}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'pressed', shownMs: 100},
      ],
    ])
  })

  it('counts each time it comes back into view still up', () => {
    const {update, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(1000)
    update({isInView: false, visible: false})
    jest.advanceTimersByTime(5000)
    update(SHOWN)
    jest.advanceTimersByTime(IMPRESSION_DELAY_MS)

    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'left', shownMs: 1000},
      ],
      ['notifications:refreshPill:impression', {tab: 'all'}],
    ])
  })

  it('only counts it while the app is in the foreground', () => {
    mockAppState = 'background'
    const {update, reported} = setup()

    update(SHOWN)
    expect(reported()).toEqual([])

    mockAppState = 'active'
    update({})
    jest.advanceTimersByTime(3000)
    mockAppState = 'background'
    update({})

    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'left', shownMs: 3000},
      ],
    ])
  })

  it('ends a showing as the tab unmounts', () => {
    const {hook, update, reported} = setup()

    update(SHOWN)
    jest.advanceTimersByTime(4000)
    hook.unmount()

    expect(reported()).toEqual([
      ['notifications:refreshPill:impression', {tab: 'all'}],
      [
        'notifications:refreshPill:hide',
        {tab: 'all', reason: 'left', shownMs: 4000},
      ],
    ])
  })

  it('reports nothing for a pill that never showed, but still presses it', () => {
    const {hook, onPress, press, reported} = setup()

    press()
    hook.unmount()

    expect(onPress).toHaveBeenCalledTimes(1)
    expect(reported()).toEqual([])
  })
})
