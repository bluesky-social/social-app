import {useInfiniteQuery} from '@tanstack/react-query'

import {GIF_GIPHY_SEARCH, GIF_GIPHY_TRENDING} from '#/lib/constants'
import {createGiphyApi} from '#/features/gifPicker/giphy'

export const RQKEY_ROOT = 'giphy-gif-service'
export const RQKEY_FEATURED = [RQKEY_ROOT, 'trending']
export const RQKEY_SEARCH = (query: string) => [RQKEY_ROOT, 'search', query]

const getTrendingGifs = createGiphyApi(GIF_GIPHY_TRENDING)
const searchGifs = createGiphyApi(GIF_GIPHY_SEARCH)

export function useFeaturedGifsQuery(options?: {enabled?: boolean}) {
  return useInfiniteQuery({
    queryKey: RQKEY_FEATURED,
    queryFn: ({pageParam}) => getTrendingGifs({offset: pageParam}),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.next,
    enabled: options?.enabled,
  })
}

export function useGifSearchQuery(
  query: string,
  options?: {enabled?: boolean},
) {
  return useInfiniteQuery({
    queryKey: RQKEY_SEARCH(query),
    queryFn: ({pageParam}) => searchGifs({q: query, offset: pageParam}),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.next,
    enabled: !!query && options?.enabled !== false,
  })
}
