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
  uri: 'at://did:plc:abc/site.standard.document/a',
  collection: 'site.standard.document',
  authorDid: 'did:plc:abc',
  position: 2,
} as const
const SECOND = {...ITEM, uri: 'at://did:plc:abc/site.standard.document/b'}
const THIRD = {...ITEM, uri: 'at://did:plc:abc/site.standard.document/c'}
type Row = {uri: string; blurred?: boolean}

function getItem(row: Row, position: number) {
  if (row.blurred) return
  return {...ITEM, uri: row.uri, position}
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
    callback(ITEM, 0)
    callback(ITEM, 0)
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

    callback(ITEM, 0)
    isActive = false
    rerender({})
    callback(ITEM, 0)
    isActive = true
    rerender({})
    expect(mockMetric).toHaveBeenCalledTimes(1)

    callback(SECOND, 1)
    expect(mockMetric).toHaveBeenLastCalledWith(
      'atmosphere:content:impression',
      {tab: 'following', surface: 'tab', ...SECOND, position: 1},
    )
    unmount()
    callback(THIRD, 2)
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
    result.current(ITEM, 0)
    result.current(SECOND, 1)
    result.current(THIRD, 2)

    items = [{uri: SECOND.uri, blurred: true}, {uri: ITEM.uri}]
    isActive = true
    rerender({})
    expect(mockMetric.mock.calls).toEqual([
      [
        'atmosphere:content:impression',
        {tab: 'discover', surface: 'tab', ...ITEM, position: 1},
      ],
    ])

    result.current(items[1], 1)
    expect(mockMetric).toHaveBeenCalledTimes(1)

    items = [SECOND, THIRD]
    rerender({})
    result.current(ITEM, 0)
    expect(mockMetric).toHaveBeenCalledTimes(1)
    result.current(SECOND, 0)
    expect(mockMetric).toHaveBeenCalledTimes(2)
  })

  it('rejects missing and stale positions without attributing the wrong row', () => {
    let items = [ITEM, SECOND]
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <AtmosphereMetricsScope tab="following" surface="tab" isActive>
        {children}
      </AtmosphereMetricsScope>
    )
    const {result, rerender} = renderHook(
      () => useLogContentImpression(items, getItem),
      {wrapper},
    )
    result.current(ITEM, undefined)
    result.current(ITEM, -1)
    result.current(ITEM, 1)
    result.current(SECOND, 2)
    expect(mockMetric).not.toHaveBeenCalled()

    items = [SECOND, ITEM]
    rerender({})
    result.current(ITEM, 0)
    expect(mockMetric).not.toHaveBeenCalled()
    result.current(ITEM, 1)
    expect(mockMetric).toHaveBeenLastCalledWith(
      'atmosphere:content:impression',
      {tab: 'following', surface: 'tab', ...ITEM, position: 1},
    )
    expect(mockMetric).toHaveBeenCalledTimes(1)
  })

  it('does nothing outside a scope', () => {
    const {result} = renderHook(() => useLogContentImpression([ITEM], getItem))
    result.current(ITEM, 0)
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
        <AtmosphereContentItem item={ITEM}>
          <Dialog />
        </AtmosphereContentItem>
      </AtmosphereMetricsScope>,
    )
    logPress?.('photoDialog')
    expect(mockMetric).toHaveBeenCalledWith('atmosphere:content:press', {
      tab: 'following',
      surface: 'photoDialog',
      ...ITEM,
      destination: 'photoDialog',
    })
  })
})
