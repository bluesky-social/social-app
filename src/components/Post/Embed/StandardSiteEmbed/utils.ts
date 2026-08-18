import {AtUri} from '@atproto/syntax'

import {type app, type com} from '#/lexicons'

export function isStandardSiteDocumentUri(
  ref: com.atproto.repo.strongRef.Main,
) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.document')
}

export function isStandardSitePublicationUri(
  ref: com.atproto.repo.strongRef.Main,
) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.publication')
}

export function isStandardSiteUri(ref: com.atproto.repo.strongRef.Main) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.')
}

export function isStandardSiteEmbed(
  view: app.bsky.embed.external.ViewExternal,
) {
  return view.associatedRefs?.some(ref => isStandardSiteUri(ref))
}

export function isStandardSitePublicationEmbed(
  view: app.bsky.embed.external.ViewExternal,
) {
  return (
    view.associatedRefs?.some(
      ref => new AtUri(ref.uri).collection === 'site.standard.publication',
    ) &&
    view.associatedRefs.every(
      ref => new AtUri(ref.uri).collection !== 'site.standard.document',
    )
  )
}
