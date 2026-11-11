import {AtUri, isAtUriString, isValidDid} from '@atproto/syntax'

import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {
  getActivityContent,
  getFirstActivity,
} from '#/screens/Atmosphere/relationships'
import {activityCollections, isActorGroup} from '#/screens/Atmosphere/types'
import {app, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type ActivityAssociatedPost = {
  uri: app.bsky.feed.defs.PostView['uri']
  cid: app.bsky.feed.defs.PostView['cid']
  view?: app.bsky.feed.defs.PostView
}

/** Resolves explicit post evidence on the row's hydrated content only. */
export function getActivityAssociatedPost(
  item: ActivityPresentationItem,
): ActivityAssociatedPost | undefined {
  const content = getActivityContent(item)
  if (!content) return undefined
  const activity = getFirstActivity(item)
  const directView = bsky.isType(app.bsky.feed.defs.postView, content.view)
    ? content.view
    : undefined

  // Standalone and actor-group native shares retain their own post.
  if (item.type === 'activity' || isActorGroup(item.group)) {
    if (activity?.collection === activityCollections.share) {
      const post = resolvePostRef(
        {uri: activity.record.uri, cid: activity.record.cid},
        directView,
      )
      if (post) return post
    }
  }

  // This is a typed ref field, so its optional $type tag is not required.
  const associatedView =
    !content.bskyPostRef ||
    content.viewBskyPost?.uri === content.bskyPostRef.uri
      ? content.viewBskyPost
      : undefined
  const declaredPost = resolvePostRef(content.bskyPostRef, directView)
  if (declaredPost) {
    if (associatedView?.uri === declaredPost.uri) {
      const hydratedPost = resolvePostRef(
        {uri: associatedView.uri, cid: associatedView.cid},
        associatedView,
      )
      if (hydratedPost) return hydratedPost
    }
    return declaredPost
  }

  if (!content.bskyPostRef && associatedView) {
    return resolvePostRef(
      {uri: associatedView.uri, cid: associatedView.cid},
      associatedView,
    )
  }
  if (
    directView &&
    (!content.bskyPostRef || directView.uri === content.bskyPostRef.uri)
  ) {
    return resolvePostRef(
      {uri: directView.uri, cid: directView.cid},
      directView,
    )
  }

  const shareFallback =
    activity?.collection === activityCollections.share
      ? resolvePostRef({uri: activity.record.uri, cid: activity.record.cid})
      : undefined
  const external = content.view
  if (
    !bsky.isType(app.bsky.embed.external.viewArticle, external) &&
    !bsky.isType(app.bsky.embed.external.viewArticlePublication, external) &&
    !bsky.isType(app.bsky.embed.external.viewGallery, external) &&
    !bsky.isType(app.bsky.embed.external.viewLivestream, external)
  ) {
    return shareFallback
  }

  if (!Array.isArray(external.associatedRefs)) return shareFallback
  for (const ref of external.associatedRefs) {
    const post = resolvePostRef(ref)
    if (post) return post
  }
  return shareFallback
}

function resolvePostRef(
  ref: unknown,
  view?: app.bsky.feed.defs.PostView,
): ActivityAssociatedPost | undefined {
  if (!bsky.matches(com.atproto.repo.strongRef, ref)) return undefined
  if (!isAtUriString(ref.uri)) return undefined

  const uri = new AtUri(ref.uri)
  if (
    !isValidDid(uri.host) ||
    uri.collection !== activityCollections.share ||
    !uri.rkey ||
    uri.hash
  ) {
    return undefined
  }

  return {
    uri: ref.uri,
    cid: ref.cid,
    ...(view?.uri === ref.uri && view.cid === ref.cid ? {view} : {}),
  }
}
