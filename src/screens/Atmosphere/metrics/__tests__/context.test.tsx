import {render, renderHook} from '@testing-library/react-native'

import {
  AtmosphereContentItem,
  AtmosphereMetricsRestore,
  AtmosphereMetricsScope,
  useAtmosphereMetricsSnapshot,
  useLogContentImpression,
  useLogContentPress,
} from '../context'

const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

const ITEM = {
  contentType: 'article',
  contentId: 'https://example.com/a',
  position: 2,
} as const
const SECOND = {...ITEM, contentId: 'https://example.com/b'}
const THIRD = {...ITEM, contentId: 'https://example.com/c'}
type Row = {contentId: string; blurred?: boolean}

function getItem(row: Row, position: number) {
  if (row.blurred) return
  return {contentType: 'article' as const, contentId: row.contentId, position}
}

beforeEach(() => mockMetric.mockClear())

describe('useLogContentImpression', () => {
  it('flushes inactive callbacks on activation, once per content item per mount', () => {
    let isActive = false
    const items = [ITEM, SECOND, THIRD]
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <AtmosphereMetricsScope tab="following" surface="tab" isActive={isActive}>
        {children}
      </AtmosphereMetricsScope>
    )
    const {result, rerender, unmount} = renderHook(
      () => useLogContentImpression(items, getItem),
      {wrapper},
    )
    const callback = result.current
    callback(ITEM)
    callback(ITEM)
    expect(mockMetric).not.toHaveBeenCalled()

    isActive = true
    rerender({})
    expect(result.current).toBe(callback)
    expect(mockMetric.mock.calls).toEqual([
      [
        'atmosphere:content:impression',
        {tab: 'following', surface: 'tab', ...ITEM, position: 0},
      ],
    ])

    callback(ITEM)
    isActive = false
    rerender({})
    callback(ITEM)
    isActive = true
    rerender({})
    expect(mockMetric).toHaveBeenCalledTimes(1)

    callback(SECOND)
    expect(mockMetric).toHaveBeenLastCalledWith(
      'atmosphere:content:impression',
      {tab: 'following', surface: 'tab', ...SECOND, position: 1},
    )
    unmount()
    callback(THIRD)
    expect(mockMetric).toHaveBeenCalledTimes(2)
  })

  it('flushes only currently eligible data with current positions and clears the queue', () => {
    let isActive = false
    let items: Row[] = [ITEM, SECOND, THIRD]
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <AtmosphereMetricsScope tab="discover" surface="tab" isActive={isActive}>
        {children}
      </AtmosphereMetricsScope>
    )
    const {result, rerender} = renderHook(
      () => useLogContentImpression(items, getItem),
      {wrapper},
    )
    result.current(ITEM)
    result.current(SECOND)
    result.current(THIRD)

    items = [
      {contentId: SECOND.contentId, blurred: true},
      {contentId: ITEM.contentId},
    ]
    isActive = true
    rerender({})
    expect(mockMetric.mock.calls).toEqual([
      [
        'atmosphere:content:impression',
        {tab: 'discover', surface: 'tab', ...ITEM, position: 1},
      ],
    ])

    result.current(items[1])
    expect(mockMetric).toHaveBeenCalledTimes(1)

    items = [SECOND, THIRD]
    rerender({})
    result.current(ITEM)
    expect(mockMetric).toHaveBeenCalledTimes(1)
    result.current(SECOND)
    expect(mockMetric).toHaveBeenCalledTimes(2)
  })

  it('does nothing outside a scope', () => {
    const {result} = renderHook(() => useLogContentImpression([ITEM], getItem))
    result.current(ITEM)
    expect(mockMetric).not.toHaveBeenCalled()
  })
})

describe('content attribution', () => {
  it('carries the card and tab into a dialog as its surface', () => {
    let logPress: ReturnType<typeof useLogContentPress> | undefined
    function Card() {
      logPress = useLogContentPress()
      return null
    }
    function Dialog() {
      const snapshot = useAtmosphereMetricsSnapshot()
      return (
        <AtmosphereMetricsRestore snapshot={snapshot} surface="photoDialog">
          <Card />
        </AtmosphereMetricsRestore>
      )
    }
    render(
      <AtmosphereMetricsScope tab="following" surface="tab" isActive>
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
