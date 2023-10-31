import {useMemo} from 'react'

import {PostView} from '@atproto/api/dist/client/types/app/bsky/feed/defs'
import {AppBskyEmbedExternal, AppBskyEmbedImages} from '@atproto/api'
import {getYoutubeVideoId} from 'lib/strings/url-helpers'
import {extractMiniblogUriInfo} from 'lib/waverly/miniblog-uris'

type Type = 'none' | 'image' | 'youtube' | 'link'

interface LinkInfo {
  title: string
  description: string
  length: string
  host?: string
  uri: string
  originalUri: string
}
/**
 * - type: none | image | youtube | link
 * - image: optional image uri
 * - link: optional link title / description text
 * - quote: optional quote text
 */
export interface EmbedInfo {
  /** - none | image | youtube | link */
  type: Type
  image?: {uri: string; alt?: string}
  link?: LinkInfo
  quote?: string // Body of the quote, without any quote markup prefix ("")
}

export const useEmbedInfo = (
  embed: PostView['embed'],
  readerLink?: string,
  quoteText?: string,
): EmbedInfo => {
  return useMemo(() => {
    const image = AppBskyEmbedImages.isView(embed)
      ? (embed as AppBskyEmbedImages.View).images[0]
      : undefined

    const external = AppBskyEmbedExternal.isView(embed)
      ? (embed as AppBskyEmbedExternal.View).external
      : undefined

    // If it's a YouTube uri, render as image
    const youtubeId = external && getYoutubeVideoId(external.uri)

    const imgUri = youtubeId
      ? `https://img.youtube.com/vi/${youtubeId}/sd1.jpg`
      : external?.thumb ?? image?.fullsize
    const imgAlt = external?.title ?? image?.alt

    const isMiniblog = !!extractMiniblogUriInfo(external?.uri)
    const type: Type = isMiniblog
      ? 'none'
      : youtubeId
      ? 'youtube'
      : external
      ? 'link'
      : image && imgUri
      ? 'image'
      : 'none'

    let host: string | undefined
    try {
      host = external?.uri && new URL(external?.uri).host
    } catch {}
    const title = external?.title ?? ''
    const description = external?.description ?? ''
    const length = '4 min'

    const uri = readerLink && type === 'link' ? readerLink : external?.uri

    if (type === 'none') return {type}

    return {
      type,
      image: imgUri ? {uri: imgUri, alt: imgAlt} : undefined,
      link: uri
        ? {title, description, length, host, uri, originalUri: external!.uri}
        : undefined,
      quote: quoteText,
    }
  }, [embed, quoteText, readerLink])
}
