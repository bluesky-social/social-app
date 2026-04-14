import {Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {keepPreviousData, useInfiniteQuery} from '@tanstack/react-query'

import {GIF_KLIPY_FEATURED, GIF_KLIPY_SEARCH} from '#/lib/constants'
import {logger} from '#/logger'
import {type Gif} from '#/state/queries/tenor'

export const RQKEY_ROOT = 'klipy-gif-service'
export const RQKEY_FEATURED = [RQKEY_ROOT, 'featured']
export const RQKEY_SEARCH = (query: string) => [RQKEY_ROOT, 'search', query]

const getTrendingGifs = createKlipyApi(GIF_KLIPY_FEATURED)
const searchGifs = createKlipyApi<{q: string}>(GIF_KLIPY_SEARCH)

export function useFeaturedGifsQuery(options?: {enabled?: boolean}) {
  return useInfiniteQuery({
    queryKey: RQKEY_FEATURED,
    queryFn: ({pageParam}) => getTrendingGifs({pos: pageParam}),
    initialPageParam: undefined as string | undefined,
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
    queryFn: ({pageParam}) => searchGifs({q: query, pos: pageParam}),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.next,
    enabled: !!query && options?.enabled !== false,
    placeholderData: keepPreviousData,
  })
}

function createKlipyApi<Input extends object>(
  urlFn: (params: string) => string,
): (input: Input & {pos?: string}) => Promise<{
  next: string
  results: Gif[]
}> {
  return async input => {
    const params = new URLSearchParams()

    params.set(
      'client_key',
      Platform.select({
        ios: 'bluesky-ios',
        android: 'bluesky-android',
        default: 'bluesky-web',
      }),
    )

    // 30 is divisible by 2 and 3, so both 2 and 3 column layouts can be used
    params.set('limit', '30')

    params.set('contentfilter', 'high')

    const locale = getLocales?.()?.[0]

    if (locale) {
      params.set('locale', locale.languageTag.replace('-', '_'))
    }

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        params.set(key, String(value))
      }
    }

    const res = await fetch(urlFn(params.toString()), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch KLIPY API')
    }
    const body: {next: string; results: Gif[]} = await res.json()
    return {
      next: body.next,
      results: body.results,
    }
  }
}

/**
 * Returns the static URL for a KLIPY GIF preview image.
 * KLIPY images are served directly from their CDN (static.klipy.com),
 * unlike Tenor which routes through t.gifs.bsky.app.
 */
export function klipyStaticUrl(gifUrl: string) {
  try {
    new URL(gifUrl)
    return gifUrl
  } catch (e) {
    logger.debug('invalid url passed to klipyStaticUrl()')
    return ''
  }
}
