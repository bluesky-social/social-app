import {isValidDid, parseAtUriString} from '@atproto/syntax'

import {place, site, social} from '#/lexicons'
import {type AtmosphereContentMetricContext} from './types'

/** The record each kind of content card is about, which its author owns. */
const CONTENT_COLLECTIONS = {
  article: site.standard.document.$type,
  publication: site.standard.publication.$type,
  gallery: social.grain.gallery.$type,
  livestream: place.stream.livestream.$type,
} as const

/**
 * Props for `AtmosphereContentItem`: `uri`, `collection` and `authorDid` come
 * from the AT URI of the card's own record, e.g. the article, not the
 * recommendation that surfaced it. Returns undefined, so the card logs
 * nothing, if the view doesn't reference that record.
 */
export function getContentMetricContextProps(
  contentType: keyof typeof CONTENT_COLLECTIONS,
  view: {associatedRefs?: {uri: string}[]},
  rest: Omit<
    AtmosphereContentMetricContext,
    'tab' | 'surface' | 'uri' | 'collection' | 'authorDid'
  >,
) {
  const collection = CONTENT_COLLECTIONS[contentType]
  for (const {uri} of view.associatedRefs ?? []) {
    const parsed = parseAtUriString(uri)
    if (
      parsed.success &&
      parsed.value.collection === collection &&
      isValidDid(parsed.value.authority)
    ) {
      return {...rest, uri, collection, authorDid: parsed.value.authority}
    }
  }
}
