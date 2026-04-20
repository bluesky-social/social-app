import {logger} from '#/logger'

/**
 * Rewrites a provider's CDN URL (Tenor or Klipy) to the corresponding
 * bsky proxy hostname. Leaves unrecognized hosts untouched.
 */
export function gifPreviewUrl(gifUrl: string) {
  try {
    const url = new URL(gifUrl)
    if (url.hostname === 'media.tenor.com') {
      url.hostname = 't.gifs.bsky.app'
      return url.href
    }
    if (url.hostname === 'static.klipy.com') {
      url.hostname = 'k.gifs.bsky.app'
      return url.href
    }
    return gifUrl
  } catch (e) {
    logger.debug('invalid url passed to gifPreviewUrl()')
    return ''
  }
}

/**
 * GIF shape returned by the Bluesky GIF proxy. The field names follow the
 * Tenor schema; Klipy responses are normalized to the same shape by the
 * proxy so downstream code can be provider-agnostic.
 */
export type Gif = {
  created: number
  hasaudio: boolean
  id: string
  media_formats: Record<BaseContentFormats, MediaObject> &
    Partial<Record<VideoContentFormats, MediaObject>>
  tags: string[]
  title: string
  content_description: string
  itemurl: string
  hascaption: boolean
  flags: string
  bg_color?: string
  url: string
}

type MediaObject = {
  url: string
  dims: [number, number]
  duration: number
  size: number
}

type BaseContentFormats = 'preview' | 'gif' | 'tinygif'

type VideoContentFormats = 'mp4' | 'webm'

export type ContentFormats = BaseContentFormats | VideoContentFormats
