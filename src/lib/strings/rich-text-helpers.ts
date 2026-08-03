import {type RichText} from '@bsky.app/sdk/richtext'

import {app} from '#/lexicons'
import * as bsky from '#/types/bsky'
import {linkRequiresWarning} from './url-helpers'

export function richTextToString(rt: RichText, loose: boolean): string {
  const {text, facets} = rt

  if (!facets?.length) {
    return text
  }

  let result = ''

  for (const segment of rt.segments()) {
    const link = segment.link

    if (link && bsky.matches(app.bsky.richtext.facet.link, link)) {
      const href = link.uri
      const text = segment.text

      const requiresWarning = linkRequiresWarning(href, text)

      result += !requiresWarning ? href : loose ? `[${text}](${href})` : text
    } else {
      result += segment.text
    }
  }

  return result
}

/**
 * Widens facets typed by the legacy `@atproto/api` codegen into the shape the
 * SDK's `RichText` accepts.
 *
 * The two are the same lexicon and identical at runtime; they differ only in
 * that the SDK brands `did`/`uri` as template literal types, which makes the
 * legacy `string` versions unassignable. Call this where facets read off an
 * `@atproto/api` view type are handed to `new RichText(...)`.
 *
 * Transitional: it goes away once the view types come from the SDK too.
 */
export function asSdkFacets(
  facets: {index: {byteStart: number; byteEnd: number}; features: unknown[]}[],
): app.bsky.richtext.facet.Main[]
export function asSdkFacets(
  facets:
    | {index: {byteStart: number; byteEnd: number}; features: unknown[]}[]
    | undefined,
): app.bsky.richtext.facet.Main[] | undefined
export function asSdkFacets(facets: unknown) {
  return facets as app.bsky.richtext.facet.Main[] | undefined
}
