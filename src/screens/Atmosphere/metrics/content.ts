import {isValidDid, parseAtUriString} from '@atproto/syntax'

import {place, site, social} from '#/lexicons'
import {type AtmosphereContentMetricContext} from './types'

/** The record a content card is about, which its author owns. */
const CONTENT_COLLECTIONS = {
  article: site.standard.document.$type,
  publication: site.standard.publication.$type,
  gallery: social.grain.gallery.$type,
  livestream: place.stream.livestream.$type,
} as const satisfies Record<
  AtmosphereContentMetricContext['contentType'],
  string
>

/**
 * The content fields of an Atmosphere content card's metrics. `authorDid` is
 * the owner of the card's own record, e.g. the gallery, and is unset if the view
 * doesn't reference one.
 */
export function getContentMetricContextProps(
  contentType: AtmosphereContentMetricContext['contentType'],
  view: {uri: string; associatedRefs?: {uri: string}[]},
): Pick<AtmosphereContentMetricContext, 'contentType' | 'uri' | 'authorDid'> {
  const collection = CONTENT_COLLECTIONS[contentType]
  let authorDid: string | undefined
  for (const {uri} of view.associatedRefs ?? []) {
    const parsed = parseAtUriString(uri)
    if (
      parsed.success &&
      parsed.value.collection === collection &&
      isValidDid(parsed.value.authority)
    ) {
      authorDid = parsed.value.authority
      break
    }
  }
  return {contentType, uri: view.uri, authorDid}
}
