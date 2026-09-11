import {AtUri} from '@atproto/syntax'

import {makeProfileLink} from '#/lib/routes/links'
import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {
  type ActivityActor,
  activityCollections,
  type ActivityItem,
  type AssociatedRecords,
  isRecommendRecord,
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
  activity: ActivityItem,
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

/** First API-ordered child for bounded actor-group previews. */
export function getFirstActivity(item: ActivityPresentationItem) {
  return item.type === 'activity' ? item.activity : item.group.items[0]
}

/** Resolves a document root or interaction target using the supplied collection. */
export function getActivityDocumentUri(
  activity: ActivityItem,
  associatedRecords: AssociatedRecords,
): string | undefined {
  const record = associatedRecords[activity.record.uri]?.record
  switch (activity.collection) {
    case activityCollections.document:
      return activity.record.uri
    case activityCollections.recommendation:
      return isRecommendRecord(record) ? record.document : undefined
    case activityCollections.share:
      return getShareDocumentUri(record)
    default:
      return undefined
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
