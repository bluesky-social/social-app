import {LINK_META_PROXY} from '#/lib/constants'
import {getGiphyMetaUri} from '#/lib/strings/embed-player'
import {parseStarterPackUri} from '#/lib/strings/starter-pack'
import {type app} from '#/lexicons'
import {isBskyAppUrl} from '../strings/url-helpers'

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
  error?: string
  likelyType: LikelyType
  url: string
  title?: string
  description?: string
  image?: string
  /**
   * The AT-URI of the Atmosphere record representing this external content, if
   * it exists. Example: a site.standard.document record.
   */
  associatedRefs?: app.bsky.embed.external.External['associatedRefs']
  view?: app.bsky.embed.external.View
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
    return {
      error: 'Invalid URL',
      likelyType: LikelyType.Other,
      url,
    }
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

    const body = await response.json()

    if (body.error !== '') {
      throw new Error(body.error)
    }

    meta.description = body.description
    meta.image = body.image
    meta.title = body.title
    meta.associatedRefs = body.associated_refs
    meta.view = body.view || body.external_view
    if (shouldFollowRedirect) {
      meta.url = body.url
    }
  } catch (e) {
    // failed
    console.error(e)
    meta.error = e instanceof Error ? e.toString() : 'Failed to fetch link'
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
