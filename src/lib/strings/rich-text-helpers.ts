import {AppBskyRichtextFacet, RichText} from '@atproto/api'
import {linkRequiresWarning} from './url-helpers'

export function richTextToString(rt: RichText, loose: boolean): string {
  const {text, facets} = rt

  if (!facets?.length) {
    return text
  }

  let result = ''

  for (const segment of rt.segments()) {
    const link = segment.link

    if (link && AppBskyRichtextFacet.validateLink(link).success) {
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
