import {AppBskyRichtextFacet, RichText, UnicodeString} from '@atproto/api'

import {toShortUrl} from './url-helpers'

export function shortenLinks(rt: RichText): RichText {
  if (!rt.facets?.length) {
    return rt
  }
  rt = rt.clone()
  // enumerate the link facets
  if (rt.facets) {
    for (const facet of rt.facets) {
      const isLink = !!facet.features.find(AppBskyRichtextFacet.isLink)
      if (!isLink) {
        continue
      }

      // extract and shorten the URL
      const {byteStart, byteEnd} = facet.index
      const url = rt.unicodeText.slice(byteStart, byteEnd)
      const shortened = new UnicodeString(toShortUrl(url))

      // insert the shorten URL
      rt.insert(byteStart, shortened.utf16)
      // update the facet to cover the new shortened URL
      facet.index.byteStart = byteStart
      facet.index.byteEnd = byteStart + shortened.length
      // remove the old URL
      rt.delete(byteStart + shortened.length, byteEnd + shortened.length)
    }
  }
  return rt
}

// filter out any mention facets that didn't map to a user
export function stripInvalidMentions(rt: RichText): RichText {
  if (!rt.facets?.length) {
    return rt
  }
  rt = rt.clone()
  if (rt.facets) {
    rt.facets = rt.facets?.filter(facet => {
      const mention = facet.features.find(AppBskyRichtextFacet.isMention)
      if (mention && !mention.did) {
        return false
      }
      return true
    })
  }
  return rt
}
