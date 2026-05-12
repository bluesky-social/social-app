import {getLocales} from 'expo-localization'

import {type Gif} from '#/features/gifPicker/types'

type GiphyImage = {
  url: string
  width: string
  height: string
  size?: string
  mp4?: string
  mp4_size?: string
  webp?: string
  webp_size?: string
}

type GiphyGif = {
  id: string
  url: string
  title: string
  alt_text?: string
  import_datetime?: string
  images: {
    original: GiphyImage
    fixed_height_small?: GiphyImage
    preview_gif?: GiphyImage
  }
}

type GiphyResponse = {
  data: GiphyGif[]
  pagination: {
    total_count: number
    count: number
    offset: number
  }
}

export type GiphyEndpoint = 'trending' | 'search'

export type GiphyApiInput = {
  q?: string
  offset?: number
}

export type GiphyApiResult = {
  next: number | undefined
  results: Gif[]
}

const LIMIT = 30
const RATING = 'g'

export function createGiphyApi(
  urlBuilder: (params: string) => string,
): (input: GiphyApiInput) => Promise<GiphyApiResult> {
  return async input => {
    const params = new URLSearchParams()
    params.set('limit', String(LIMIT))
    params.set('rating', RATING)

    const locale = getLocales?.()?.[0]
    if (locale?.languageCode) {
      params.set('lang', locale.languageCode.toLowerCase())
    }

    if (typeof input.offset === 'number' && input.offset > 0) {
      params.set('offset', String(input.offset))
    }
    if (input.q !== undefined) {
      params.set('q', input.q)
    }

    const res = await fetch(urlBuilder(params.toString()), {
      method: 'GET',
    })
    if (!res.ok) {
      throw new Error(`Failed to fetch Giphy API (status ${res.status})`)
    }
    const body = (await res.json()) as GiphyResponse
    const nextOffset = body.pagination.offset + body.pagination.count
    return {
      next: nextOffset < body.pagination.total_count ? nextOffset : undefined,
      results: body.data.map(toGif),
    }
  }
}

function toGif(g: GiphyGif): Gif {
  const original = g.images.original
  const preview =
    g.images.preview_gif ?? g.images.fixed_height_small ?? original
  const tinygif =
    g.images.fixed_height_small ?? g.images.preview_gif ?? original
  const altText = g.alt_text || g.title
  return {
    created: parseImportDate(g.import_datetime),
    hasaudio: false,
    id: g.id,
    media_formats: {
      gif: toMediaObject(original),
      preview: toMediaObject(preview),
      tinygif: toMediaObject(tinygif),
      ...(original.mp4
        ? {
            mp4: {
              url: original.mp4,
              dims: dims(original),
              duration: 0,
              size: parseInt(original.mp4_size ?? '0', 10) || 0,
            },
          }
        : null),
    },
    tags: [],
    title: g.title,
    content_description: altText,
    itemurl: g.url,
    hascaption: false,
    flags: '',
    url: g.url,
  }
}

function toMediaObject(img: GiphyImage) {
  return {
    url: img.url,
    dims: dims(img),
    duration: 0,
    size: parseInt(img.size ?? '0', 10) || 0,
  }
}

function dims(img: GiphyImage): [number, number] {
  return [parseInt(img.width, 10) || 0, parseInt(img.height, 10) || 0]
}

function parseImportDate(s: string | undefined): number {
  if (!s) return 0
  const t = Date.parse(s.replace(' ', 'T') + 'Z')
  return Number.isNaN(t) ? 0 : Math.floor(t / 1000)
}
