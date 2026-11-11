import {AtUri} from '@atproto/syntax'

import {makeProfileLink} from '#/lib/routes/links'
import {getArticleExternalView} from '#/screens/Atmosphere/externalViews'
import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {
  type ActivityActor,
  activityCollections,
  type ActivityContent,
  type ActivityGroupItem,
  type ActivityItem,
  isActorGroup,
} from '#/screens/Atmosphere/types'
import {com} from '#/lexicons'
import * as bsky from '#/types/bsky'

/** Resolves only the external media's document, never a quoted post or text URL. */
export function getShareDocumentUri(record: unknown): string | undefined {
  if (!isObject(record) || record.$type !== activityCollections.share) {
    return undefined
  }

  let embed = record.embed
  if (!isObject(embed)) return undefined
  if (embed.$type === 'app.bsky.embed.recordWithMedia') {
    embed = embed.media
  }
  if (!isObject(embed) || embed.$type !== 'app.bsky.embed.external') {
    return undefined
  }

  const external = embed.external
  if (!isObject(external) || !Array.isArray(external.associatedRefs)) {
    return undefined
  }

  for (const ref of external.associatedRefs) {
    if (!bsky.matches(com.atproto.repo.strongRef, ref)) continue

    const uri = new AtUri(ref.uri)
    if (
      uri.host.startsWith('did:') &&
      uri.collection === activityCollections.document &&
      uri.rkey
    ) {
      return ref.uri
    }
  }
  return undefined
}

/** A thread link for the actual post owner, never a document or quoted post. */
export function getSharePostHref(
  activity: ActivityItem | ActivityGroupItem,
  actor: ActivityActor,
): string | undefined {
  if (activity.collection !== activityCollections.share) return undefined
  try {
    const uri = new AtUri(activity.record.uri)
    return uri.host === actor.did &&
      uri.collection === activityCollections.share &&
      uri.rkey
      ? makeProfileLink(actor, 'post', uri.rkey)
      : undefined
  } catch {
    return undefined
  }
}

/** The actual first API reference; a shared subject is not an activity. */
export function getFirstActivity(
  item: ActivityPresentationItem,
): ActivityItem | ActivityGroupItem | undefined {
  if (item.type === 'activity') return item.activity
  return isActorGroup(item.group) ? item.group.item : item.group.activities[0]
}

/** The only hydrated target supplied for this row. */
export function getActivityContent(
  item: ActivityPresentationItem,
): ActivityContent | undefined {
  if (item.type === 'activity') return item.activity
  return isActorGroup(item.group) ? item.group.item : item.group.subject
}

export function getActivityCount(item: ActivityPresentationItem): number {
  if (item.type === 'activity') return 1
  return isActorGroup(item.group)
    ? item.group.uris.length
    : item.group.activities.length
}

/** Resolves only the document reference pinned in this activity's hydrated view. */
export function getActivityDocumentUri(
  activity: ActivityContent,
): string | undefined {
  if ('uri' in activity) {
    try {
      const uri = new AtUri(activity.uri)
      return uri.host.startsWith('did:') &&
        uri.collection === activityCollections.document &&
        uri.rkey
        ? activity.uri
        : undefined
    } catch {
      return undefined
    }
  }
  if (activity.collection === activityCollections.document) {
    return activity.record.uri
  }
  if (
    activity.collection !== activityCollections.recommendation &&
    activity.collection !== activityCollections.share
  )
    return undefined

  for (const ref of getArticleExternalView(activity)?.associatedRefs ?? []) {
    try {
      const uri = new AtUri(ref.uri)
      if (
        uri.host.startsWith('did:') &&
        uri.collection === activityCollections.document &&
        uri.rkey
      )
        return ref.uri
    } catch {
      continue
    }
  }
  return undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
