import {renderHook} from '@testing-library/react-native'

import {serializeHistoryEntry} from '#/screens/Search/searchParams'
import {useSearchHistory} from './index'
import {useRecentSearchesSource} from './useRecentSearchesSource'

jest.mock('./index', () => ({useSearchHistory: jest.fn()}))

it('keeps searches with the same text and different filters distinct', () => {
  const filters = {author: 'alice.test'}
  jest.mocked(useSearchHistory).mockReturnValue({
    termHistory: ['cats', serializeHistoryEntry('cats', filters)],
    profiles: [],
  } as unknown as ReturnType<typeof useSearchHistory>)
  const {result} = renderHook(() => useRecentSearchesSource())
  expect(result.current.items).toEqual([
    {key: 'recent-cats', type: 'search', value: 'cats', filters: {}},
    {
      key: `recent-${serializeHistoryEntry('cats', filters)}`,
      type: 'search',
      value: 'cats',
      filters,
    },
  ])
})
