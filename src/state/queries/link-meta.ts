import {useQuery} from '@tanstack/react-query'

import {LINK_META_PROXY, POST_IMG_MAX} from '#/lib/constants'
import {extractBskyMeta} from '#/lib/link-meta/bsky'
import {getLikelyType, LikelyType, LinkMeta} from '#/lib/link-meta/link-meta'
import {downloadAndResize} from '#/lib/media/manip'
import {getGiphyMetaUri} from '#/lib/strings/embed-player'
import {isBskyAppUrl} from '#/lib/strings/url-helpers'
import {STALE} from '#/state/queries'
import {useAgent} from '#/state/session'
import {ComposerImage, createComposerImage} from '../gallery'

const TIMEOUT = 15e3

const RQKEY_ROOT = 'link-meta'
export const RQKEY = (url: string) => [RQKEY_ROOT, url]

export type LinkMetaReturn = {
  meta: LinkMeta
  thumb?: ComposerImage
}

export function useLinkMetaQuery(url: string) {
  const agent = useAgent()

  return useQuery({
    staleTime: STALE.MINUTES.FIVE,
    queryKey: RQKEY(url),
    async queryFn(): Promise<LinkMetaReturn> {
      if (isBskyAppUrl(url)) {
        const meta = await extractBskyMeta(agent, url)
        return {meta: meta}
      }

      let urlp
      try {
        urlp = new URL(url)

        // Get Giphy meta uri if this is any form of giphy link
        const giphyMetaUri = getGiphyMetaUri(urlp)
        if (giphyMetaUri) {
          url = giphyMetaUri
          urlp = new URL(url)
        }
      } catch (e) {
        return {
          meta: {error: 'Invalid URL', likelyType: LikelyType.Other, url},
        }
      }

      const likelyType = getLikelyType(urlp)

      const meta: LinkMeta = {
        likelyType,
        url,
      }
      let thumb: ComposerImage | undefined

      if (likelyType !== LikelyType.HTML) {
        return {meta, thumb}
      }

      try {
        const signal = AbortSignal.timeout(TIMEOUT)
        const proxyUrl = `${LINK_META_PROXY(
          agent.serviceUrl.toString() || '',
        )}${encodeURIComponent(url)}`

        const response = await fetch(proxyUrl, {signal})
        const body = await response.json()

        const {description, error, image, title} = body

        if (error !== '') {
          throw new Error(error)
        }

        meta.description = description
        meta.image = image
        meta.title = title
      } catch (e) {
        // failed
        console.error(e)
        meta.error = e instanceof Error ? e.toString() : 'Failed to fetch link'
      }

      if (meta.image) {
        try {
          const img = await downloadAndResize({
            uri: meta.image,
            width: POST_IMG_MAX.width,
            height: POST_IMG_MAX.height,
            mode: 'contain',
            maxSize: POST_IMG_MAX.size,
            timeout: 15e3,
          })

          if (img) {
            thumb = await createComposerImage(img)
          }
        } catch {}
      }

      return {meta, thumb}
    },
  })
}
