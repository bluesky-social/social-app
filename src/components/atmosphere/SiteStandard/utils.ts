import {AtUri} from '@atproto/syntax'

import {hexToRgb, rgbToHex} from '#/alf/util/colorGeneration'
import {type app, type com, site} from '#/lexicons'

export function isStandardSiteDocumentUri(
  ref: com.atproto.repo.strongRef.Main,
) {
  return new AtUri(ref.uri).collection === site.standard.document.$type
}

export function isStandardSitePublicationUri(
  ref: com.atproto.repo.strongRef.Main,
) {
  return new AtUri(ref.uri).collection === site.standard.publication.$type
}

export function isStandardSiteUri(ref: com.atproto.repo.strongRef.Main) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.')
}

export function isStandardSiteEmbed(
  view:
    | app.bsky.embed.external.ViewArticle
    | app.bsky.embed.external.ViewArticlePublication,
) {
  return view.associatedRefs?.some(ref => isStandardSiteUri(ref))
}

/** Normalizes to opaque hex so contrast checks match the rendered colors. */
export function getPublicationTheme(
  view: app.bsky.embed.external.ViewArticlePublication,
) {
  const accent = hexToRgb(view.theme?.accent ?? '')
  const foreground = hexToRgb(view.theme?.accentForeground ?? '')
  if (!accent || !foreground) return undefined
  return {
    accent: rgbToHex(accent.r, accent.g, accent.b),
    accentForeground: rgbToHex(foreground.r, foreground.g, foreground.b),
  }
}
