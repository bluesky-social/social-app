import {act, render} from '@testing-library/react-native'

import {
  AtmosphereContentItem,
  AtmosphereMetricsRestore,
  AtmosphereMetricsScope,
  createVisit,
  useAtmosphereMetricsSnapshot,
  useLogContentPress,
  type Visit,
} from '../context'

const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

let mockIsVisible = true
jest.mock('../visibility', () => ({
  useIsVisible: (_ref: unknown, enabled: boolean) => enabled && mockIsVisible,
}))

const ITEM = {
  contentType: 'article',
  contentId: 'https://example.com/a',
  position: 2,
  section: 'articles',
} as const

let logPress: ReturnType<typeof useLogContentPress> | undefined
function Card() {
  logPress = useLogContentPress()
  return null
}

function Screen({
  isActive = true,
  visit,
  cards = 1,
}: {
  isActive?: boolean
  visit: Visit
  cards?: number
}) {
  return (
    <AtmosphereMetricsScope
      tab="explore"
      surface="tab"
      isActive={isActive}
      visit={visit}>
      {Array.from({length: cards}, (_, i) => (
        <AtmosphereContentItem key={i} {...ITEM}>
          <Card />
        </AtmosphereContentItem>
      ))}
    </AtmosphereMetricsScope>
  )
}

const impressions = () =>
  mockMetric.mock.calls.filter(
    ([event]) => event === 'atmosphere:content:impression',
  )

beforeEach(() => {
  jest.useFakeTimers()
  mockMetric.mockClear()
  mockIsVisible = true
})

afterEach(() => {
  jest.useRealTimers()
})

describe('AtmosphereContentItem', () => {
  it('logs an impression after half a second in view, once per visit', () => {
    const visit = createVisit()
    const {rerender} = render(<Screen visit={visit} cards={2} />)
    act(() => jest.advanceTimersByTime(499))
    expect(impressions()).toEqual([])

    act(() => jest.advanceTimersByTime(1))
    expect(impressions()).toEqual([
      [
        'atmosphere:content:impression',
        {tab: 'explore', surface: 'tab', ...ITEM},
      ],
    ])

    // Remounting doesn't count again within the visit
    rerender(<Screen visit={visit} cards={0} />)
    rerender(<Screen visit={visit} cards={1} />)
    act(() => jest.advanceTimersByTime(1000))
    expect(impressions()).toHaveLength(1)

    rerender(<Screen visit={createVisit()} cards={1} />)
    act(() => jest.advanceTimersByTime(500))
    expect(impressions()).toHaveLength(2)
  })

  it("doesn't log while the scope is out of view or the card isn't visible", () => {
    const visit = createVisit()
    const {rerender} = render(<Screen visit={visit} isActive={false} />)
    act(() => jest.advanceTimersByTime(1000))
    expect(impressions()).toEqual([])

    mockIsVisible = false
    rerender(<Screen visit={visit} />)
    act(() => jest.advanceTimersByTime(1000))
    expect(impressions()).toEqual([])
  })

  it('logs presses with the card and scope', () => {
    mockIsVisible = false
    render(<Screen visit={createVisit()} />)
    logPress?.('external')
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:content:press', {
      tab: 'explore',
      surface: 'tab',
      ...ITEM,
      target: 'external',
    })
  })
})

describe('AtmosphereMetricsRestore', () => {
  it('carries the card and tab into a dialog, as its surface', () => {
    function Dialog() {
      const snapshot = useAtmosphereMetricsSnapshot()
      return (
        <AtmosphereMetricsRestore snapshot={snapshot} surface="photoDialog">
          <Card />
        </AtmosphereMetricsRestore>
      )
    }
    mockIsVisible = false
    render(
      <AtmosphereMetricsScope
        tab="following"
        surface="tab"
        isActive
        visit={createVisit()}>
        <AtmosphereContentItem {...ITEM}>
          <Dialog />
        </AtmosphereContentItem>
      </AtmosphereMetricsScope>,
    )
    logPress?.('photoDialog')
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:content:press', {
      tab: 'following',
      surface: 'photoDialog',
      ...ITEM,
      target: 'photoDialog',
    })
  })
})
