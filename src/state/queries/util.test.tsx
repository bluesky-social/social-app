import {renderHook} from '@testing-library/react-native'

import {useAutoPagination} from './util'

function query(overrides: Record<string, unknown> = {}) {
  return {
    data: {pageParams: [undefined]},
    isLoading: false,
    isRefetching: false,
    isFetchingNextPage: false,
    hasNextPage: true,
    fetchNextPage: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('useAutoPagination', () => {
  it('fetches another page when visible items are missing', () => {
    const value = query()

    renderHook(() => useAutoPagination(value, 0, 10))

    expect(value.fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('stops when the requested number of items is visible', () => {
    const value = query()

    renderHook(() => useAutoPagination(value, 10, 10))

    expect(value.fetchNextPage).not.toHaveBeenCalled()
  })

  it('stops when the server repeats a cursor', () => {
    const value = query({data: {pageParams: [undefined, 'a', 'a']}})

    renderHook(() => useAutoPagination(value, 0, 10))

    expect(value.fetchNextPage).not.toHaveBeenCalled()
  })

  it('stops when structured page params repeat a cursor', () => {
    const value = query({
      data: {pageParams: [undefined, {cursor: 'a'}, {cursor: 'a'}]},
    })

    renderHook(() => useAutoPagination(value, 0, 10))

    expect(value.fetchNextPage).not.toHaveBeenCalled()
  })

  it('stops when a cursor repeats non-adjacently', () => {
    const value = query({data: {pageParams: [undefined, 'a', 'b', 'a']}})

    renderHook(() => useAutoPagination(value, 0, 10))

    expect(value.fetchNextPage).not.toHaveBeenCalled()
  })

  it('fills one page after switching to a smaller cached query', () => {
    const first = query({hasNextPage: false})
    const second = query()
    let value = first
    let itemCount = 10
    const {rerender} = renderHook(() => useAutoPagination(value, itemCount, 10))

    value = second
    itemCount = 5
    rerender(undefined)

    expect(second.fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('resets the attempt limit after switching to cached data with the same item count', () => {
    const fetchNextPage = jest.fn().mockResolvedValue(undefined)
    const data = {pageParams: [undefined]}
    let value = query({fetchNextPage, data})
    const itemCount = 0
    const {rerender} = renderHook(() => useAutoPagination(value, itemCount, 10))

    for (let i = 1; i < 5; i++) {
      value = query({
        fetchNextPage,
        data,
      })
      rerender(undefined)
    }
    expect(fetchNextPage).toHaveBeenCalledTimes(4)

    const second = query({
      data: {
        pageParams: Array.from({length: 51}, (_, i) => `new-cursor-${i}`),
      },
    })
    value = second
    rerender(undefined)

    expect(second.fetchNextPage).toHaveBeenCalledTimes(1)
  })
})
