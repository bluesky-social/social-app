import {Platform} from 'react-native'
import {getLocales} from 'expo-localization'
import {keepPreviousData, useInfiniteQuery} from '@tanstack/react-query'

import {GIF_FEATURED, GIF_SEARCH} from '#/lib/constants'

export const RQKEY_ROOT = 'gif-service'
export const RQKEY_FEATURED = [RQKEY_ROOT, 'featured']
export const RQKEY_SEARCH = (query: string) => [RQKEY_ROOT, 'search', query]

const getTrendingGifs = createTenorApi(GIF_FEATURED)

const searchGifs = createTenorApi<{q: string}>(GIF_SEARCH)

export function useFeaturedGifsQuery() {
  return useInfiniteQuery({
    queryKey: RQKEY_FEATURED,
    queryFn: ({pageParam}) => getTrendingGifs({pos: pageParam}),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.next,
  })
}

export function useGifSearchQuery(query: string) {
  return useInfiniteQuery({
    queryKey: RQKEY_SEARCH(query),
    queryFn: ({pageParam}) => searchGifs({q: query, pos: pageParam}),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: lastPage => lastPage.next,
    enabled: !!query,
    placeholderData: keepPreviousData,
  })
}

function createTenorApi<Input extends object>(
  urlFn: (params: string) => string,
): (input: Input & {pos?: string}) => Promise<{
  next: string
  results: Gif[]
}> {
  return async input => {
    const params = new URLSearchParams()

    // set client key based on platform
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

    params.set(
      'media_filter',
      (['preview', 'gif', 'tinygif'] satisfies ContentFormats[]).join(','),
    )

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
      throw new Error('Failed to fetch Tenor API')
    }
    return res.json()
  }
}

export type Gif = {
  /**
   * A Unix timestamp that represents when this post was created.
   */
  created: number
  /**
   * Returns true if this post contains audio.
   * Note: Only video formats support audio. The GIF image file format can't contain audio information.
   */
  hasaudio: boolean
  /**
   * Tenor result identifier
   */
  id: string
  /**
   * A dictionary with a content format as the key and a Media Object as the value.
   */
  media_formats: Record<ContentFormats, MediaObject>
  /**
   * An array of tags for the post
   */
  tags: string[]
  /**
   * The title of the post
   */
  title: string
  /**
   * A textual description of the content.
   * We recommend that you use content_description for user accessibility features.
   */
  content_description: string
  /**
   * The full URL to view the post on tenor.com.
   */
  itemurl: string
  /**
   * Returns true if this post contains captions.
   */
  hascaption: boolean
  /**
   * Comma-separated list to signify whether the content is a sticker or static image, has audio, or is any combination of these. If sticker and static aren't present, then the content is a GIF. A blank flags field signifies a GIF without audio.
   */
  flags: string
  /**
   * The most common background pixel color of the content
   */
  bg_color?: string
  /**
   * A short URL to view the post on tenor.com.
   */
  url: string
}

type MediaObject = {
  /**
   * A URL to the media source
   */
  url: string
  /**
   * Width and height of the media in pixels
   */
  dims: [number, number]
  /**
   * Represents the time in seconds for one loop of the content. If the content is static, the duration is set to 0.
   */
  duration: number
  /**
   * Size of the file in bytes
   */
  size: number
}

type ContentFormats =
  | 'preview'
  | 'gif'
  // | 'mediumgif'
  | 'tinygif'
// | 'nanogif'
// | 'mp4'
// | 'loopedmp4'
// | 'tinymp4'
// | 'nanomp4'
// | 'webm'
// | 'tinywebm'
// | 'nanowebm'
