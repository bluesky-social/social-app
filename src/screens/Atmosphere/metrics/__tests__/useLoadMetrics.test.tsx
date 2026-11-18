import {render} from '@testing-library/react-native'

import {AtmosphereMetricsScope} from '../context'
import {useLoadMetrics} from '../useLoadMetrics'

const mockMetric = jest.fn()
jest.mock('#/analytics', () => ({
  useAnalytics: () => ({metric: mockMetric}),
}))

type Load = Parameters<typeof useLoadMetrics>[0]
let metrics: ReturnType<typeof useLoadMetrics> | undefined

function Tab(load: Load) {
  metrics = useLoadMetrics(load)
  return null
}

function renderTab(load: Load, isActive = true) {
  const tree = (props: Load, active: boolean) => (
    <AtmosphereMetricsScope tab="following" surface="tab" isActive={active}>
      <Tab {...props} />
    </AtmosphereMetricsScope>
  )
  const {rerender} = render(tree(load, isActive))
  return (next: Load, active = true) => rerender(tree(next, active))
}

const loaded = (event: string) =>
  mockMetric.mock.calls.filter(([name]) => name === event)

beforeEach(() => {
  mockMetric.mockClear()
})

it('logs the first load once after the tab is shown', () => {
  const update = renderTab(
    {hasData: false, isError: false, itemCount: 0},
    false,
  )
  update({hasData: false, isError: false, itemCount: 0})
  update({hasData: true, isError: false, itemCount: 3})
  update({hasData: true, isError: false, itemCount: 0})

  expect(loaded('atmosphere:content:loaded')).toEqual([
    [
      'atmosphere:content:loaded',
      {
        tab: 'following',
        surface: 'tab',
        state: 'populated',
        itemCount: 3,
        hasCachedData: false,
      },
    ],
  ])
})

it('waits until shown to log already loaded data', () => {
  const update = renderTab({hasData: true, isError: false, itemCount: 0}, false)
  expect(mockMetric).not.toHaveBeenCalled()

  update({hasData: true, isError: false, itemCount: 0})
  expect(loaded('atmosphere:content:loaded')).toEqual([
    [
      'atmosphere:content:loaded',
      expect.objectContaining({
        state: 'empty',
        hasCachedData: true,
      }),
    ],
  ])
})

it('logs a load that settled while away only on return', () => {
  const update = renderTab({hasData: false, isError: false, itemCount: 0})
  update({hasData: false, isError: false, itemCount: 0}, false)
  update({hasData: true, isError: false, itemCount: 2}, false)
  expect(mockMetric).not.toHaveBeenCalled()

  update({hasData: true, isError: false, itemCount: 2})
  expect(loaded('atmosphere:content:loaded')).toEqual([
    [
      'atmosphere:content:loaded',
      expect.objectContaining({
        state: 'populated',
        itemCount: 2,
        hasCachedData: false,
      }),
    ],
  ])
})

it('waits for the load to settle after returning to a loading tab', () => {
  const update = renderTab({hasData: false, isError: false, itemCount: 0})
  update({hasData: false, isError: false, itemCount: 0}, false)
  update({hasData: false, isError: false, itemCount: 0})
  expect(mockMetric).not.toHaveBeenCalled()

  update({hasData: false, isError: true, itemCount: 0})
  expect(loaded('atmosphere:content:loaded')).toEqual([
    [
      'atmosphere:content:loaded',
      expect.objectContaining({state: 'error', hasCachedData: false}),
    ],
  ])
})

it('logs a failed first load as an error', () => {
  renderTab({hasData: false, isError: true, itemCount: 0})

  expect(loaded('atmosphere:content:loaded')).toEqual([
    [
      'atmosphere:content:loaded',
      expect.objectContaining({state: 'error', itemCount: 0}),
    ],
  ])
})

it('logs page growth once, not the initial load or unchanged page counts', () => {
  const update = renderTab({hasData: false, isError: false, itemCount: 0})
  const load = {hasData: true, isError: false, itemCount: 2}
  update({...load, pages: [[1, 2]]})
  mockMetric.mockClear()

  update({...load, itemCount: 3, pages: [[1, 2], [3]]})
  update({...load, itemCount: 3, pages: [[1, 2], [3]]})
  expect(mockMetric.mock.calls).toEqual([
    [
      'atmosphere:list:pageLoaded',
      {
        tab: 'following',
        surface: 'tab',
        pageIndex: 1,
        itemCount: 1,
        totalItemCount: 3,
      },
    ],
  ])
})

it('counts each new page when multiple pages arrive before a render', () => {
  const load = {hasData: true, isError: false, itemCount: 2}
  const update = renderTab({...load, pages: [[1, 2]]})
  mockMetric.mockClear()

  update({...load, itemCount: 5, pages: [[1, 2], [3], [4, 5]]})
  expect(loaded('atmosphere:list:pageLoaded')).toEqual([
    [
      'atmosphere:list:pageLoaded',
      {
        tab: 'following',
        surface: 'tab',
        pageIndex: 1,
        itemCount: 1,
        totalItemCount: 3,
      },
    ],
    [
      'atmosphere:list:pageLoaded',
      {
        tab: 'following',
        surface: 'tab',
        pageIndex: 2,
        itemCount: 2,
        totalItemCount: 5,
      },
    ],
  ])
})

it('does not recount cached pages and allows new pages after the list shrinks', () => {
  const load = {hasData: true, isError: false, itemCount: 3}
  const update = renderTab({...load, pages: [[1, 2], [3]]})
  expect(loaded('atmosphere:list:pageLoaded')).toEqual([])
  mockMetric.mockClear()

  update({...load, itemCount: 2, pages: [[10, 11]]})
  update({...load, itemCount: 3, pages: [[10, 11], [12]]})
  expect(loaded('atmosphere:list:pageLoaded')).toEqual([
    [
      'atmosphere:list:pageLoaded',
      {
        tab: 'following',
        surface: 'tab',
        pageIndex: 1,
        itemCount: 1,
        totalItemCount: 3,
      },
    ],
  ])
})

it('logs nothing outside a scope', () => {
  const screen = render(
    <Tab hasData isError={false} itemCount={1} pages={[[1]]} />,
  )
  metrics?.logRefresh()
  metrics?.logRetry('initial')
  screen.rerender(
    <Tab hasData isError={false} itemCount={2} pages={[[1], [2]]} />,
  )

  expect(mockMetric).not.toHaveBeenCalled()
})
