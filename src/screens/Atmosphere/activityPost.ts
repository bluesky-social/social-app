import {AtUri, isAtUriString, isValidDid} from '@atproto/syntax'

import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {getFirstActivity} from '#/screens/Atmosphere/relationships'
import {activityCollections} from '#/screens/Atmosphere/types'
import {app, com} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type ActivityAssociatedPost = {
  uri: app.bsky.feed.defs.PostView['uri']
  cid: app.bsky.feed.defs.PostView['cid']
  view?: app.bsky.feed.defs.PostView
}

/** Resolves only explicit post evidence on the first API-ordered activity. */
export function getActivityAssociatedPost(
  item: ActivityPresentationItem,
): ActivityAssociatedPost | undefined {
  const activity = getFirstActivity(item)
  if (!activity) return undefined

  const view = bsky.isType(app.bsky.feed.defs.postView, activity.view)
    ? activity.view
    : undefined
  const declaredPost = resolvePostRef(activity.bskyPostRef, view)
  if (declaredPost) return declaredPost

  if (activity.collection === activityCollections.share) {
    const post = resolvePostRef(
      {uri: activity.record.uri, cid: activity.record.cid},
      view,
    )
    if (post) return post
  }

  if (view) return resolvePostRef({uri: view.uri, cid: view.cid}, view)

  const external = activity.view
  if (
    !bsky.isType(app.bsky.embed.external.viewArticle, external) &&
    !bsky.isType(app.bsky.embed.external.viewArticlePublication, external) &&
    !bsky.isType(app.bsky.embed.external.viewGallery, external) &&
    !bsky.isType(app.bsky.embed.external.viewLivestream, external)
  ) {
    return undefined
  }

  if (!Array.isArray(external.associatedRefs)) return undefined
  for (const ref of external.associatedRefs) {
    const post = resolvePostRef(ref)
    if (post) return post
  }
  return undefined
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
