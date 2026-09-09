export const activityCollections = {
  document: 'site.standard.document',
  publication: 'site.standard.publication',
  recommendation: 'site.standard.graph.recommend',
  subscription: 'site.standard.graph.subscription',
  livestream: 'place.stream.livestream',
  grainPhoto: 'social.grain.photo',
} as const

export type KnownActivityCollection =
  (typeof activityCollections)[keyof typeof activityCollections]

const knownActivityCollections = new Set<string>(
  Object.values(activityCollections),
)

export function isKnownActivityCollection(
  collection: string,
): collection is KnownActivityCollection {
  return knownActivityCollections.has(collection)
}

export type ActivityRecord = {
  uri: string
  cid: string
  indexedAt: string
}

export type ActivityItem = {
  $type: 'eric.bsky.atmosphere.getActivity#item'
  record: ActivityRecord
  collection: string
  viewerState: {
    subscribed: boolean
  }
}

export type CollectionActivityItem<TCollection extends string> =
  ActivityItem & {
    collection: TCollection
  }

export type ActivityGroup = {
  $type: 'eric.bsky.atmosphere.getActivity#group'
  id: string
  groupBy: 'subject' | 'actor'
  collection: string
  indexedAt: string
  subject?: string
  actor?: string
  items: ActivityItem[]
}

export type ActivityFeedEntry = ActivityItem | ActivityGroup

export type AssociatedRecord = {
  uri: string
  cid: string
  record: {
    $type?: string
    [key: string]: unknown
  }
}

export type AssociatedRecords = Record<string, AssociatedRecord>

export type ActivityActor = {
  did: string
  handle: string
  displayName?: string
  pronouns?: string
  avatar?: string
  createdAt?: string
}

export type ActivityActors = Record<string, ActivityActor>

export type AtmosphereActivityPage = {
  feed: ActivityFeedEntry[]
  associatedRecords: AssociatedRecords
  actors: ActivityActors
  cursor?: string
}

export type DocumentRecord = {
  $type?: 'site.standard.document'
  site: string
  title: string
  textContent?: string
  description?: unknown
  path?: unknown
  publishedAt: string
  updatedAt?: unknown
  coverImage?: unknown
}

export type PublicationRecord = {
  $type?: 'site.standard.publication'
  name: string
  url: string
  description?: unknown
  icon?: unknown
  basicTheme?: unknown
}

export type RecommendRecord = {
  $type?: 'site.standard.graph.recommend'
  document: string
  createdAt: string
}

export type SubscriptionRecord = {
  $type?: 'site.standard.graph.subscription'
  publication: string
  createdAt?: string
}

export type LivestreamRecord = {
  $type?: 'place.stream.livestream'
  title?: string
  url?: string
  createdAt: string
  endedAt?: string
}

export type GrainPhotoRecord = {
  $type?: 'social.grain.photo'
  alt?: string
  photo: {
    ref: unknown
    mimeType: string
  }
  aspectRatio?: {
    width: number
    height: number
  }
  createdAt?: string
}

export function narrowActivityPage(value: {
  feed: unknown[]
  associatedRecords: unknown
  actors: unknown
  cursor?: string
}): AtmosphereActivityPage {
  return {
    feed: value.feed.flatMap(entry => {
      const narrowed = narrowActivityEntry(entry)
      return narrowed ? [narrowed] : []
    }),
    associatedRecords: narrowAssociatedRecords(value.associatedRecords),
    actors: narrowActors(value.actors),
    cursor: value.cursor,
  }
}

function narrowActivityEntry(value: unknown): ActivityFeedEntry | undefined {
  if (!isObject(value) || typeof value.$type !== 'string') return undefined
  if (value.$type === 'eric.bsky.atmosphere.getActivity#item') {
    return narrowActivityItem(value)
  }
  if (value.$type !== 'eric.bsky.atmosphere.getActivity#group') {
    return undefined
  }
  if (
    typeof value.id !== 'string' ||
    (value.groupBy !== 'subject' && value.groupBy !== 'actor') ||
    typeof value.collection !== 'string' ||
    typeof value.indexedAt !== 'string' ||
    !Array.isArray(value.items)
  ) {
    return undefined
  }
  if (
    (value.groupBy === 'subject' && typeof value.subject !== 'string') ||
    (value.groupBy === 'actor' && typeof value.actor !== 'string')
  ) {
    return undefined
  }
  const items = value.items.flatMap(item => {
    const narrowed = narrowActivityItem(item)
    return narrowed ? [narrowed] : []
  })
  if (items.length < 2) return undefined
  return {
    $type: value.$type,
    id: value.id,
    groupBy: value.groupBy,
    collection: value.collection,
    indexedAt: value.indexedAt,
    subject: typeof value.subject === 'string' ? value.subject : undefined,
    actor: typeof value.actor === 'string' ? value.actor : undefined,
    items,
  }
}

function narrowActivityItem(value: unknown): ActivityItem | undefined {
  if (
    !isObject(value) ||
    value.$type !== 'eric.bsky.atmosphere.getActivity#item' ||
    !isObject(value.record) ||
    typeof value.record.uri !== 'string' ||
    typeof value.record.cid !== 'string' ||
    typeof value.record.indexedAt !== 'string' ||
    typeof value.collection !== 'string' ||
    !isObject(value.viewerState) ||
    typeof value.viewerState.subscribed !== 'boolean'
  ) {
    return undefined
  }
  return {
    $type: value.$type,
    record: {
      uri: value.record.uri,
      cid: value.record.cid,
      indexedAt: value.record.indexedAt,
    },
    collection: value.collection,
    viewerState: {
      subscribed: value.viewerState.subscribed,
    },
  }
}

export function narrowAssociatedRecords(value: unknown): AssociatedRecords {
  if (!isObject(value)) return {}

  const records: AssociatedRecords = {}
  for (const [key, candidate] of Object.entries(value)) {
    if (
      isObject(candidate) &&
      typeof candidate.uri === 'string' &&
      typeof candidate.cid === 'string' &&
      isObject(candidate.record)
    ) {
      records[key] = {
        uri: candidate.uri,
        cid: candidate.cid,
        record: candidate.record,
      }
    }
  }
  return records
}

export function narrowActors(value: unknown): ActivityActors {
  if (!isObject(value)) return {}

  const actors: ActivityActors = {}
  for (const [key, candidate] of Object.entries(value)) {
    if (
      isObject(candidate) &&
      typeof candidate.did === 'string' &&
      typeof candidate.handle === 'string'
    ) {
      actors[key] = {
        did: candidate.did,
        handle: candidate.handle,
        displayName:
          typeof candidate.displayName === 'string'
            ? candidate.displayName
            : undefined,
        pronouns:
          typeof candidate.pronouns === 'string'
            ? candidate.pronouns
            : undefined,
        avatar:
          typeof candidate.avatar === 'string' ? candidate.avatar : undefined,
        createdAt:
          typeof candidate.createdAt === 'string'
            ? candidate.createdAt
            : undefined,
      }
    }
  }
  return actors
}

export function isDocumentRecord(value: unknown): value is DocumentRecord {
  return (
    isObject(value) &&
    typeof value.site === 'string' &&
    typeof value.title === 'string' &&
    typeof value.publishedAt === 'string'
  )
}

export function isPublicationRecord(
  value: unknown,
): value is PublicationRecord {
  return (
    isObject(value) &&
    typeof value.name === 'string' &&
    typeof value.url === 'string'
  )
}

export function isRecommendRecord(value: unknown): value is RecommendRecord {
  return (
    isObject(value) &&
    typeof value.document === 'string' &&
    typeof value.createdAt === 'string'
  )
}

export function isSubscriptionRecord(
  value: unknown,
): value is SubscriptionRecord {
  return isObject(value) && typeof value.publication === 'string'
}

export function isLivestreamRecord(value: unknown): value is LivestreamRecord {
  return isObject(value) && typeof value.createdAt === 'string'
}

export function isGrainPhotoRecord(value: unknown): value is GrainPhotoRecord {
  return (
    isObject(value) &&
    isObject(value.photo) &&
    'ref' in value.photo &&
    typeof value.photo.mimeType === 'string'
  )
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
