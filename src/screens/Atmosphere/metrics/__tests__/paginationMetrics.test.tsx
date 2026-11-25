import {i18n} from '@lingui/core'
import {I18nProvider} from '@lingui/react'
import {
  notifyManager,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from '@tanstack/react-query'
import {act, render, waitFor} from '@testing-library/react-native'

import {AtmosphereActivityListScreen} from '#/screens/Atmosphere/ActivityList'
import {ActivityTab} from '#/screens/Atmosphere/ActivityTab'
import {AtmosphereMetricsScope} from '../context'

const mockMetric = jest.fn()
const mockQueryFn = jest.fn<Promise<number[]>, [number, AbortSignal]>()
let mockHasNextPage = true

jest.mock('#/analytics', () => ({
  useAnalytics: () => ({
    metric: mockMetric,
    features: {enabled: () => true, AtmosphereScreenEnable: 'enabled'},
  }),
}))
jest.mock('@react-navigation/native', () => ({useIsFocused: () => true}))
jest.mock('#/lib/appState', () => ({useAppState: () => 'active'}))
jest.mock('#/alf', () => ({
  atoms: new Proxy({}, {get: () => ({})}),
  useTheme: () => ({atoms: new Proxy({}, {get: () => ({})})}),
}))
jest.mock('#/components/Typography', () => ({
  Text: jest.requireActual<typeof import('react-native')>('react-native').Text,
}))
jest.mock('#/components/Loader', () => ({Loader: () => null}))
jest.mock('#/components/Lists', () => ({ListFooter: () => null}))
jest.mock('#/components/Layout', () => {
  const {View, Text} =
    jest.requireActual<typeof import('react-native')>('react-native')
  return {
    Screen: View,
    Header: {
      Outer: View,
      Content: View,
      TitleText: Text,
      BackButton: () => null,
      Slot: () => null,
    },
  }
})
jest.mock('#/view/screens/NotFound', () => ({NotFoundScreen: () => null}))
jest.mock('#/view/com/util/error/ErrorMessage', () => ({
  ErrorMessage: () => null,
}))
jest.mock('#/view/com/util/List', () => ({
  List: jest.requireActual<typeof import('react-native')>('react-native').View,
}))
jest.mock(
  '#/screens/Atmosphere/ActivityTab/components/ActivityContentHider',
  () => ({ActivityContentHider: () => null}),
)
jest.mock('#/screens/Atmosphere/ActivityTab/components/ActivityRow', () => ({
  ActivityRow: () => null,
  ActivityContentCard: () => null,
  ActivityWarning: () => null,
}))
jest.mock('#/screens/Atmosphere/ActivityTab/useActivityTimelineQuery', () => ({
  useActivityTimelineQuery: () => mockUsePages(),
}))
jest.mock('#/screens/Atmosphere/ActivityList/useActivityListQuery', () => ({
  useActivityListQuery: () => mockUsePages(),
}))

/** Keep real TanStack fetching/cancellation; card rendering isn't under test. */
const mockUsePages = function usePages() {
  return useInfiniteQuery({
    queryKey: ['pagination-metrics'],
    queryFn: ({pageParam, signal}) => mockQueryFn(pageParam, signal),
    initialPageParam: 0,
    initialData: {pages: [[1, 2]], pageParams: [0]},
    getNextPageParam: (_page, pages) =>
      mockHasNextPage ? pages.length : undefined,
    staleTime: Infinity,
    retry: false,
  })
}

function deferredPage() {
  let resolve!: (page: number[]) => void
  const promise = new Promise<number[]>(res => {
    resolve = res
  })
  return {promise, resolve}
}

const pageEvents = () =>
  mockMetric.mock.calls.filter(
    ([event]) => event === 'atmosphere:list:pageLoaded',
  )

beforeAll(() => {
  notifyManager.setNotifyFunction(callback => {
    act(callback)
  })
})

afterAll(() => {
  notifyManager.setNotifyFunction(callback => callback())
})

beforeEach(() => {
  i18n.loadAndActivate({locale: 'en', messages: {}})
  mockMetric.mockClear()
  mockQueryFn.mockReset()
  mockHasNextPage = true
})

describe.each([
  ['Activity', 'activityList', 'tab', 'following'],
  ['Activity list', 'atmosphereActivityList', 'activityList', undefined],
] as const)('%s pagination', (name, testID, surface, tab) => {
  function setup() {
    const queryClient = new QueryClient({
      defaultOptions: {queries: {gcTime: Infinity}},
    })
    const screen = render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider i18n={i18n}>
          <AtmosphereMetricsScope tab="following" surface="tab" isActive>
            {name === 'Activity' ? (
              <ActivityTab />
            ) : (
              <AtmosphereActivityListScreen
                route={{params: {uris: ''}} as never}
                navigation={{} as never}
              />
            )}
          </AtmosphereMetricsScope>
        </I18nProvider>
      </QueryClientProvider>,
    )
    const list = () =>
      screen.getByTestId(testID).props as {
        onEndReached: () => Promise<void>
        ListFooterComponent: React.ReactElement<{
          onRetry: () => Promise<unknown>
        }>
        data: number[]
      }
    return {
      queryClient,
      next: () => list().onEndReached(),
      retry: () => list().ListFooterComponent.props.onRetry(),
      items: () => list().data,
    }
  }

  it('counts overlapping callers once, then counts the next real page', async () => {
    const first = deferredPage()
    const replacement = deferredPage()
    mockQueryFn
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(replacement.promise)
    const list = setup()

    await act(async () => {
      const a = list.next()
      const b = list.next()
      expect(mockQueryFn).toHaveBeenCalledTimes(2)
      expect(mockQueryFn.mock.calls[0][1].aborted).toBe(true)
      // The cancelled caller can wait on its replacement's result.
      replacement.resolve([3])
      await Promise.all([a, b])
      first.resolve([999])
    })
    await waitFor(() => expect(list.items()).toEqual([1, 2, 3]))
    expect(pageEvents()).toEqual([
      [
        'atmosphere:list:pageLoaded',
        {tab, surface, pageIndex: 1, itemCount: 1, totalItemCount: 3},
      ],
    ])

    mockQueryFn.mockResolvedValueOnce([4, 5])
    await act(() => list.next())
    await waitFor(() => expect(list.items()).toEqual([1, 2, 3, 4, 5]))
    expect(pageEvents()[1]).toEqual([
      'atmosphere:list:pageLoaded',
      {tab, surface, pageIndex: 2, itemCount: 2, totalItemCount: 5},
    ])
    expect(pageEvents()).toHaveLength(2)
  })

  it('does not count a cancelled fetch that returns existing pages', async () => {
    mockQueryFn.mockResolvedValueOnce([3])
    const list = setup()
    await act(() => list.next())
    await waitFor(() => expect(list.items()).toEqual([1, 2, 3]))
    mockMetric.mockClear()
    const cancelled = deferredPage()
    mockQueryFn.mockReturnValueOnce(cancelled.promise)

    await act(async () => {
      const pending = list.next()
      await list.queryClient.cancelQueries()
      await pending
      cancelled.resolve([999])
    })
    expect(list.items()).toEqual([1, 2, 3])
    expect(pageEvents()).toEqual([])
  })

  it('does not count a successful result when there is no next page', async () => {
    mockQueryFn.mockResolvedValueOnce([3])
    const list = setup()
    await act(() => list.next())
    await waitFor(() => expect(list.items()).toEqual([1, 2, 3]))
    mockMetric.mockClear()
    mockQueryFn.mockClear()
    mockHasNextPage = false

    await act(() => list.retry())
    expect(mockQueryFn).not.toHaveBeenCalled()
    expect(pageEvents()).toEqual([])
  })

  it('counts a successful retry but not the failed attempt', async () => {
    mockQueryFn.mockRejectedValueOnce(new Error('Pagination failed'))
    const list = setup()
    await act(() => list.next())
    expect(pageEvents()).toEqual([])

    mockQueryFn.mockResolvedValueOnce([3])
    await act(() => list.retry())
    await waitFor(() => expect(list.items()).toEqual([1, 2, 3]))
    expect(pageEvents()).toEqual([
      [
        'atmosphere:list:pageLoaded',
        {tab, surface, pageIndex: 1, itemCount: 1, totalItemCount: 3},
      ],
    ])
  })

  it('does not count refetched pages and allows pagination after a reset', async () => {
    mockQueryFn.mockResolvedValueOnce([3])
    const list = setup()
    await act(() => list.next())
    await waitFor(() => expect(list.items()).toEqual([1, 2, 3]))
    mockMetric.mockClear()

    mockQueryFn.mockResolvedValueOnce([10, 11]).mockResolvedValueOnce([12])
    await act(() => list.queryClient.refetchQueries())
    await waitFor(() => expect(list.items()).toEqual([10, 11, 12]))
    expect(pageEvents()).toEqual([])

    mockQueryFn.mockResolvedValueOnce([1, 2])
    await act(() => list.queryClient.resetQueries())
    await waitFor(() => expect(list.items()).toEqual([1, 2]))
    mockQueryFn.mockResolvedValueOnce([20, 21])
    await act(() => list.next())
    await waitFor(() => expect(list.items()).toEqual([1, 2, 20, 21]))
    expect(pageEvents()).toEqual([
      [
        'atmosphere:list:pageLoaded',
        {tab, surface, pageIndex: 1, itemCount: 2, totalItemCount: 4},
      ],
    ])
  })
})
