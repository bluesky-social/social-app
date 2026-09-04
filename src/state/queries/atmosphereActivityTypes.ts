export type ActivityRecord = {
  uri: string
  cid: string
  indexedAt: string
}

export type ActivityItem = {
  record: ActivityRecord
  viewerState: {
    subscribed: boolean
  }
}

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
  feed: ActivityItem[]
  associatedRecords: AssociatedRecords
  actors: ActivityActors
  cursor?: string
}

export type DocumentRecord = {
  $type?: 'site.standard.document'
  site: string
  title: string
  textContent?: string
  publishedAt: string
}

export type PublicationRecord = {
  $type?: 'site.standard.publication'
  name: string
  url: string
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
  feed: ActivityItem[]
  associatedRecords: unknown
  actors: unknown
  cursor?: string
}): AtmosphereActivityPage {
  return {
    feed: value.feed.map(item => ({
      record: {
        uri: item.record.uri,
        cid: item.record.cid,
        indexedAt: item.record.indexedAt,
      },
      viewerState: {
        subscribed: item.viewerState.subscribed,
      },
    })),
    associatedRecords: narrowAssociatedRecords(value.associatedRecords),
    actors: narrowActors(value.actors),
    cursor: value.cursor,
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
