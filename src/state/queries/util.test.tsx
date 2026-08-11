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
})
