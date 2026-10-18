import {act, renderHook, waitFor} from '@testing-library/react-native'

import {useIncrementalList} from '#/lib/hooks/useIncrementalList'
import * as Toast from '#/components/Toast'

jest.mock('@lingui/react', () => ({
  useLingui: () => ({_: (value: {id: string}) => value.id, i18n: {}}),
}))
jest.mock('#/components/Toast', () => ({show: jest.fn()}))
jest.mock('#/logger', () => ({logger: {error: jest.fn()}}))
jest.mock('#/lib/strings/errors', () => ({isNetworkError: () => false}))

type Slice = {key: string; items: string[]}
const slices = (count: number, prefix = 'post'): Slice[] =>
  Array.from({length: count}, (_, index) => ({
    key: `${prefix}-${index}`,
    items: ['post'],
  }))
const fromData = (data: Slice[] | undefined) => data ?? []

function render(
  overrides: Partial<
    Parameters<typeof useIncrementalList<Slice[], Slice>>[0]
  > = {},
) {
  const defaults = {
    enabled: true,
    active: true,
    batchSize: 3,
    slices: slices(7),
    slicesFromData: fromData,
    resetKey: 'feed',
    hasNextPage: false,
    isFetching: false,
    isFetchingNextPage: false,
    isError: false,
    fetchNextPage: jest.fn(async () => ({
      isError: false,
      hasNextPage: false,
      data: slices(7),
    })),
  }
  return renderHook(
    props => useIncrementalList<Slice[], Slice>({...defaults, ...props}),
    {initialProps: overrides},
  )
}

function deferred() {
  let resolve!: (value: {
    isError: boolean
    hasNextPage: boolean
    data: Slice[]
  }) => void
  const promise = new Promise<Parameters<typeof resolve>[0]>(res => {
    resolve = res
  })
  return {promise, resolve}
}

beforeEach(() => jest.clearAllMocks())

describe('useIncrementalList', () => {
  it('reveals buffered batches without fetching and keeps earlier items', async () => {
    const fetchNextPage = jest.fn()
    const hook = render({fetchNextPage})
    expect(hook.result.current.visibleSlices).toHaveLength(3)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toHaveLength(6)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toHaveLength(7)
    expect(hook.result.current.canShowMore).toBe(false)
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not limit or fetch when disabled', () => {
    const fetchNextPage = jest.fn()
    const hook = render({enabled: false, hasNextPage: true, fetchNextPage})
    expect(hook.result.current.visibleSlices).toHaveLength(7)
    expect(hook.result.current.canShowMore).toBe(false)
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('does not fill an inactive or already fetching query', () => {
    const fetchNextPage = jest.fn()
    const hook = render({
      active: false,
      slices: slices(1),
      hasNextPage: true,
      fetchNextPage,
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
    hook.rerender({
      isFetching: true,
      slices: slices(1),
      hasNextPage: true,
      fetchNextPage,
    })
    expect(fetchNextPage).not.toHaveBeenCalled()
  })

  it('keeps complete threads and does not count structural markers', async () => {
    const data: Slice[] = [
      {key: 'marker', items: []},
      {key: 'thread', items: ['a', 'b']},
      {key: 'another-thread', items: ['c', 'd']},
      {key: 'last', items: ['e']},
    ]
    const hook = render({slices: data})
    expect(hook.result.current.visibleSlices.map(slice => slice.key)).toEqual([
      'marker',
      'thread',
      'another-thread',
    ])
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toEqual(data)
  })

  it('preserves the revealed boundary when Following prepends posts', async () => {
    const original = slices(10)
    const hook = render({slices: original})
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    hook.rerender({slices: [...slices(2, 'new'), ...original]})
    expect(hook.result.current.visibleSlices.map(slice => slice.key)).toEqual(
      [...slices(2, 'new'), ...original.slice(0, 6)].map(slice => slice.key),
    )
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toHaveLength(11)
  })

  it('resets on refresh, account/query identity, size, and mode changes', async () => {
    const hook = render()
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    act(() => hook.result.current.reset())
    expect(hook.result.current.visibleSlices).toHaveLength(3)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    hook.rerender({resetKey: 'another-account'})
    expect(hook.result.current.visibleSlices).toHaveLength(3)
    hook.rerender({batchSize: 2})
    expect(hook.result.current.visibleSlices).toHaveLength(2)
    hook.rerender({enabled: false})
    expect(hook.result.current.visibleSlices).toHaveLength(7)
    hook.rerender({enabled: true})
    expect(hook.result.current.visibleSlices).toHaveLength(3)
  })

  it('waits for the first query result before filling a batch', async () => {
    const fetchNextPage = jest
      .fn()
      .mockResolvedValue({isError: false, hasNextPage: false, data: slices(3)})
    const hook = render({slices: [], hasNextPage: false, fetchNextPage})
    expect(fetchNextPage).not.toHaveBeenCalled()
    hook.rerender({slices: slices(1), hasNextPage: true, fetchNextPage})
    await waitFor(() => expect(hook.result.current.isLoadingMore).toBe(false))
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('counts rendered items independently of the stored slice size', async () => {
    const data = slices(7).map(slice => ({
      ...slice,
      items: ['parent', 'video'],
    }))
    const hook = render({slices: data, getItemCount: () => 1})
    expect(hook.result.current.visibleSlices).toHaveLength(3)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toHaveLength(6)
  })

  it('fills short initial pages and stops at exhaustion', async () => {
    const fetchNextPage = jest
      .fn()
      .mockResolvedValueOnce({
        isError: false,
        hasNextPage: true,
        data: slices(2),
      })
      .mockResolvedValueOnce({
        isError: false,
        hasNextPage: false,
        data: slices(3),
      })
    const hook = render({slices: slices(1), hasNextPage: true, fetchNextPage})
    await waitFor(() => expect(hook.result.current.isLoadingMore).toBe(false))
    expect(fetchNextPage).toHaveBeenCalledTimes(2)
    hook.rerender({slices: slices(3), hasNextPage: false, fetchNextPage})
    expect(hook.result.current.visibleSlices).toHaveLength(3)
    expect(hook.result.current.canShowMore).toBe(false)
  })

  it('bounds initial filling and each click to ten pages even without progress', async () => {
    const fetchNextPage = jest
      .fn()
      .mockResolvedValue({isError: false, hasNextPage: true, data: slices(1)})
    const hook = render({slices: slices(1), hasNextPage: true, fetchNextPage})
    await waitFor(() => expect(hook.result.current.isLoadingMore).toBe(false))
    expect(fetchNextPage).toHaveBeenCalledTimes(10)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(fetchNextPage).toHaveBeenCalledTimes(20)
  })

  it('reveals partial buffered content immediately and prevents duplicate loads', async () => {
    const pending = deferred()
    const fetchNextPage = jest.fn(() => pending.promise)
    const hook = render({slices: slices(4), hasNextPage: true, fetchNextPage})
    let loading!: Promise<void>
    act(() => {
      loading = hook.result.current.onPressShowMore()
      void hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toHaveLength(4)
    expect(hook.result.current.isLoadingMore).toBe(true)
    expect(fetchNextPage).toHaveBeenCalledTimes(1)
    await act(async () => {
      pending.resolve({isError: false, hasNextPage: false, data: slices(6)})
      await loading
    })
    hook.rerender({slices: slices(6), hasNextPage: false, fetchNextPage})
    expect(hook.result.current.visibleSlices).toHaveLength(6)
  })

  it('retains content and permits retry after failed and thrown requests', async () => {
    const fetchNextPage = jest
      .fn()
      .mockResolvedValueOnce({isError: true})
      .mockRejectedValueOnce(new Error('unexpected failure'))
      .mockResolvedValueOnce({
        isError: false,
        hasNextPage: false,
        data: slices(6),
      })
    const hook = render({slices: slices(3), hasNextPage: true, fetchNextPage})
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(hook.result.current.visibleSlices).toHaveLength(3)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    expect(Toast.show).toHaveBeenCalledTimes(2)
    await act(async () => {
      await hook.result.current.onPressShowMore()
    })
    hook.rerender({slices: slices(6), hasNextPage: false, fetchNextPage})
    expect(hook.result.current.visibleSlices).toHaveLength(6)
  })

  it.each(['identity', 'refresh', 'inactive', 'unmount'])(
    'ignores an in-flight response after %s',
    async change => {
      const pending = deferred()
      const fetchNextPage = jest.fn(() => pending.promise)
      const hook = render({slices: slices(3), hasNextPage: true, fetchNextPage})
      let loading!: Promise<void>
      act(() => {
        loading = hook.result.current.onPressShowMore()
      })
      if (change === 'identity')
        hook.rerender({resetKey: 'new-feed', slices: slices(8, 'new')})
      if (change === 'refresh') act(() => hook.result.current.reset())
      if (change === 'inactive')
        hook.rerender({active: false, slices: slices(8)})
      if (change === 'unmount') hook.unmount()
      await act(async () => {
        pending.resolve({isError: true, hasNextPage: true, data: slices(8)})
        await loading
      })
      expect(Toast.show).not.toHaveBeenCalled()
      expect(fetchNextPage).toHaveBeenCalledTimes(1)
      if (change !== 'unmount')
        expect(hook.result.current.visibleSlices).toHaveLength(3)
    },
  )
})
