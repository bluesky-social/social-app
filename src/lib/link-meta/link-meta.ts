import {LINK_META_PROXY} from '#/lib/constants'
import {getGiphyMetaUri} from '#/lib/strings/embed-player'
import {parseStarterPackUri} from '#/lib/strings/starter-pack'
import {type app} from '#/lexicons'
import {isBskyAppUrl} from '../strings/url-helpers'
import {InvalidUrlError, InvalidUrlHostIPError} from './errors'

export enum LikelyType {
  HTML,
  Text,
  Image,
  Video,
  Audio,
  AtpData,
  Other,
}

export interface LinkMeta {
  likelyType: LikelyType
  url: string
  title?: string
  description?: string
  image?: string
  author?: string
  /**
   * The AT-URI of the Atmosphere record representing this external content, if
   * it exists. Example: a site.standard.document record.
   */
  associatedRefs?: app.bsky.embed.external.External['associatedRefs']
  view?: app.bsky.embed.external.View
}

type CardybLinkMetaResponse = {
  error: string
  url: string
  title?: string
  description?: string
  image?: string
  author?: string
  associated_refs?: LinkMeta['associatedRefs']
  view?: LinkMeta['view']
  external_view?: LinkMeta['view']
}

export async function getLinkMeta(
  url: string,
  timeout = 15e3,
): Promise<LinkMeta> {
  if (isBskyAppUrl(url) && !parseStarterPackUri(url)) {
    return {
      likelyType: LikelyType.AtpData,
      url,
    }
  }

  let urlp
  let shouldFollowRedirect = false
  try {
    urlp = new URL(url)

    // Get Giphy meta uri if this is any form of giphy link
    const giphyMetaUri = getGiphyMetaUri(urlp)
    if (giphyMetaUri) {
      url = giphyMetaUri
      urlp = new URL(url)
    }
    // follow redirects for soundcloud shortlinks
    // QUESTION - do we want to follow redirects in other cases? -sfn
    shouldFollowRedirect = urlp.hostname === 'on.soundcloud.com'
  } catch (e) {
    throw new InvalidUrlError()
  }
  const likelyType = getLikelyType(urlp)
  const meta: LinkMeta = {
    likelyType,
    url,
  }
  if (likelyType === LikelyType.Image) {
    return meta
  }

  const controller = new AbortController()
  const to = setTimeout(() => controller.abort(), timeout || 5e3)

  try {
    const response = await fetch(
      `${LINK_META_PROXY('')}${encodeURIComponent(url)}`,
      {signal: controller.signal},
    )

    const body = (await response.json()) as CardybLinkMetaResponse

    const errorMessage: string = body.error ?? body.Error ?? ''
    if (errorMessage !== '') {
      // Check for host IP specific errors
      if (errorMessage.toLowerCase().includes('invalid url: host ip')) {
        throw new InvalidUrlHostIPError(errorMessage)
      }
      // For all other errors, just throw a generic Error
      throw new Error(errorMessage)
    }

    meta.description = body.description
    meta.image = body.image
    meta.author = body.author
    meta.title = body.title
    meta.associatedRefs = body.associated_refs
    meta.view = body.view || body.external_view
    if (shouldFollowRedirect) {
      meta.url = body.url
    }
  } finally {
    clearTimeout(to)
  }

  return meta
}

const IMAGE_PATH_REGEX =
  /\.(?:apng|avif|bmp|gif|heic|heif|ico|jpe?g|jxl|png|svgz?|tiff?|webp)$/i

export function getLikelyType(url: URL | string): LikelyType {
  if (typeof url === 'string') {
    try {
      url = new URL(url)
    } catch (e) {
      return LikelyType.Other
    }
  }

  return IMAGE_PATH_REGEX.test(url.pathname)
    ? LikelyType.Image
    : LikelyType.HTML
}
