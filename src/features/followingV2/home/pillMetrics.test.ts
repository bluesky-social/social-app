import {renderHook} from '@testing-library/react-native'

import {usePrependPillMetrics} from './pillMetrics'

describe('usePrependPillMetrics', () => {
  type Props = Parameters<typeof usePrependPillMetrics>[0]
  type Pill = Props['pill']
  const T0 = new Date('2026-10-11T12:00:00.000Z').getTime()
  const DOWN: Pill = {
    isUp: false,
    visible: false,
    count: 0,
    authors: [],
    source: undefined,
    hideReason: undefined,
  }
  const UP: Pill = {
    ...DOWN,
    isUp: true,
    visible: true,
    count: 2,
    source: 'restore',
  }

  function setup(initial: Partial<Props> = {}) {
    const metric = jest.fn()
    let props: Props = {enabled: true, metric, pill: DOWN, ...initial}
    const hook = renderHook((p: Props) => usePrependPillMetrics(p), {
      initialProps: props,
    })
    /** Renders the view again with the pill changed by `pill`. */
    const update = (pill: Partial<Pill>) => {
      props = {...props, pill: {...props.pill, ...pill}}
      hook.rerender(props)
    }
    return {metric, update}
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(T0)
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('reports one impression per offer, and why it came down, with the count it last showed', () => {
    const {metric, update} = setup()

    update(UP)
    update({count: 3})
    jest.advanceTimersByTime(5000)
    update({...DOWN, source: 'restore', hideReason: 'reachedTop'})

    expect(metric.mock.calls).toEqual([
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

  it('reports a press as the pill comes down for it, as it last showed', () => {
    const {metric, update} = setup()
    update({
      ...UP,
      count: 4,
      authors: [{did: 'a', avatar: 'https://cdn.test/a.jpg'}],
      source: 'return',
    })
    jest.advanceTimersByTime(1000)

    // Down, its count is 0 and its faces are gone.
    update({...DOWN, source: 'return', hideReason: 'pressed'})

    expect(metric.mock.calls.slice(1)).toEqual([
      [
        'followingV2:pill:press',
        {
          surface: 'homeFollowing',
          source: 'return',
          count: 4,
          presentation: 'facepile',
          shownMs: 1000,
        },
      ],
      [
        'followingV2:pill:hide',
        {
          surface: 'homeFollowing',
          source: 'return',
          reason: 'pressed',
          count: 4,
          shownMs: 1000,
        },
      ],
    ])
  })

  it('reports an offer only once it shows, and nothing for one that comes down unseen', () => {
    const {metric, update} = setup()
    // Up while the view is off screen.
    update({...UP, visible: false})
    update({...DOWN, source: 'restore', hideReason: 'replaced'})
    expect(metric).not.toHaveBeenCalled()

    update({...UP, visible: false})
    update({visible: true})

    expect(metric.mock.calls).toEqual([
      ['followingV2:pill:impression', expect.objectContaining({count: 2})],
    ])
  })

  it('reports nothing while disabled', () => {
    const {metric, update} = setup({enabled: false})
    update(UP)
    update({...DOWN, source: 'restore', hideReason: 'pressed'})

    expect(metric).not.toHaveBeenCalled()
  })
})
