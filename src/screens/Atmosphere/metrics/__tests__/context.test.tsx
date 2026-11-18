import {render, renderHook} from '@testing-library/react-native'

import {
  AtmosphereContentItem,
  AtmosphereMetricsRestore,
  AtmosphereMetricsScope,
  createVisit,
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

beforeEach(() => mockMetric.mockClear())

describe('useLogContentImpression', () => {
  it('requires an active scope and deduplicates each visit', () => {
    const visit = createVisit()
    let isActive = false
    let currentVisit = visit
    const wrapper = ({children}: {children: React.ReactNode}) => (
      <AtmosphereMetricsScope
        tab="following"
        surface="tab"
        isActive={isActive}
        visit={currentVisit}>
        {children}
      </AtmosphereMetricsScope>
    )
    const {result, rerender, unmount} = renderHook(useLogContentImpression, {
      wrapper,
    })
    const callback = result.current
    callback(ITEM)
    expect(mockMetric).not.toHaveBeenCalled()

    isActive = true
    rerender({})
    expect(result.current).toBe(callback)
    callback(ITEM)
    callback({...ITEM, position: 5})
    expect(mockMetric.mock.calls).toEqual([
      [
        'atmosphere:content:impression',
        {tab: 'following', surface: 'tab', ...ITEM},
      ],
    ])

    currentVisit = createVisit()
    rerender({})
    callback(ITEM)
    expect(mockMetric).toHaveBeenCalledTimes(2)
    unmount()
    callback({...ITEM, contentId: 'https://example.com/b'})
    expect(mockMetric).toHaveBeenCalledTimes(2)
  })

  it('does nothing outside a scope', () => {
    const {result} = renderHook(useLogContentImpression)
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
