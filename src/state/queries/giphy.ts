import {keepPreviousData, useInfiniteQuery} from '@tanstack/react-query'

import {GIPHY_API_KEY, GIPHY_API_URL} from '#/lib/constants'

export const RQKEY_ROOT = 'giphy'
export const RQKEY_TRENDING = [RQKEY_ROOT, 'trending']
export const RQKEY_SEARCH = (query: string) => [RQKEY_ROOT, 'search', query]

const getTrendingGifs = createGiphyApi<
  {
    limit?: number
    offset?: number
    rating?: string
    random_id?: string
    bundle?: string
  },
  {data: Gif[]; pagination: Pagination}
>('/v1/gifs/trending')

const searchGifs = createGiphyApi<
  {
    q: string
    limit?: number
    offset?: number
    rating?: string
    lang?: string
    random_id?: string
    bundle?: string
  },
  {data: Gif[]; pagination: Pagination}
>('/v1/gifs/search')

export function useGiphyTrending() {
  return useInfiniteQuery({
    queryKey: RQKEY_TRENDING,
    queryFn: ({pageParam}) => getTrendingGifs({offset: pageParam}),
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.pagination.offset + lastPage.pagination.count,
  })
}

export function useGifphySearch(query: string) {
  return useInfiniteQuery({
    queryKey: RQKEY_SEARCH(query),
    queryFn: ({pageParam}) => searchGifs({q: query, offset: pageParam}),
    initialPageParam: 0,
    getNextPageParam: lastPage =>
      lastPage.pagination.offset + lastPage.pagination.count,
    enabled: !!query,
    placeholderData: keepPreviousData,
  })
}

function createGiphyApi<Input extends object, Ouput>(
  path: string,
): (input: Input) => Promise<
  Ouput & {
    meta: Meta
  }
> {
  return async input => {
    const url = new URL(path, GIPHY_API_URL)
    url.searchParams.set('api_key', GIPHY_API_KEY)

    for (const [key, value] of Object.entries(input)) {
      url.searchParams.set(key, String(value))
    }

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      throw new Error('Failed to fetch Giphy API')
    }
    return res.json()
  }
}

export type Gif = {
  type: string
  id: string
  slug: string
  url: string
  bitly_url: string
  embed_url: string
  username: string
  source: string
  rating: string
  content_url: string
  user: User
  source_tld: string
  source_post_url: string
  update_datetime: string
  create_datetime: string
  import_datetime: string
  trending_datetime: string
  images: Images
  title: string
  alt_text: string
}

type Images = {
  fixed_height: {
    url: string
    width: string
    height: string
    size: string
    mp4: string
    mp4_size: string
    webp: string
    webp_size: string
  }

  fixed_height_still: {
    url: string
    width: string
    height: string
  }

  fixed_height_downsampled: {
    url: string
    width: string
    height: string
    size: string
    webp: string
    webp_size: string
  }

  fixed_width: {
    url: string
    width: string
    height: string
    size: string
    mp4: string
    mp4_size: string
    webp: string
    webp_size: string
  }

  fixed_width_still: {
    url: string
    width: string
    height: string
  }

  fixed_width_downsampled: {
    url: string
    width: string
    height: string
    size: string
    webp: string
    webp_size: string
  }

  fixed_height_small: {
    url: string
    width: string
    height: string
    size: string
    mp4: string
    mp4_size: string
    webp: string
    webp_size: string
  }

  fixed_height_small_still: {
    url: string
    width: string
    height: string
  }

  fixed_width_small: {
    url: string
    width: string
    height: string
    size: string
    mp4: string
    mp4_size: string
    webp: string
    webp_size: string
  }

  fixed_width_small_still: {
    url: string
    width: string
    height: string
  }

  downsized: {
    url: string
    width: string
    height: string
    size: string
  }

  downsized_still: {
    url: string
    width: string
    height: string
  }

  downsized_large: {
    url: string
    width: string
    height: string
    size: string
  }

  downsized_medium: {
    url: string
    width: string
    height: string
    size: string
  }

  downsized_small: {
    mp4: string
    width: string
    height: string
    mp4_size: string
  }

  original: {
    width: string
    height: string
    size: string
    frames: string
    mp4: string
    mp4_size: string
    webp: string
    webp_size: string
  }

  original_still: {
    url: string
    width: string
    height: string
  }

  looping: {
    mp4: string
  }

  preview: {
    mp4: string
    mp4_size: string
    width: string
    height: string
  }

  preview_gif: {
    url: string
    width: string
    height: string
  }
}

type User = {
  avatar_url: string
  banner_url: string
  profile_url: string
  username: string
  display_name: string
}

type Meta = {
  msg: string
  status: number
  response_id: string
}

type Pagination = {
  offset: number
  total_count: number
  count: number
}
