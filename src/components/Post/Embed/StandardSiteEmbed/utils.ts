import {
  type AppBskyEmbedExternal,
  type ComAtprotoRepoStrongRef,
} from '@atproto/api'
import {AtUri} from '@atproto/syntax'

export function isStandardSiteDocumentUri(ref: ComAtprotoRepoStrongRef.Main) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.document')
}

export function isStandardSitePublicationUri(
  ref: ComAtprotoRepoStrongRef.Main,
) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.publication')
}

export function isStandardSiteUri(ref: ComAtprotoRepoStrongRef.Main) {
  return new AtUri(ref.uri).collection.startsWith('site.standard.')
}

export function isStandardSiteEmbed(view: AppBskyEmbedExternal.ViewExternal) {
  return view.associatedRefs?.some(ref => isStandardSiteUri(ref))
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
