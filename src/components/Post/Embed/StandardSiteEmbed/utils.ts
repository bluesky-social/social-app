import {type AppBskyEmbedExternal, AtUri} from '@atproto/api'

export function isStandardSiteEmbed(view: AppBskyEmbedExternal.ViewExternal) {
  return view.associatedRefs?.some(ref =>
    new AtUri(ref.uri).collection.startsWith('site.standard.'),
  )
}

export function isStandardSitePublicationEmbed(
  view: AppBskyEmbedExternal.ViewExternal,
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
