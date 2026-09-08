import {AtUri} from '@atproto/syntax'
import {type InfiniteData} from '@tanstack/react-query'

import {
  type ActivityActor,
  type ActivityActors,
  type ActivityGroup,
  type ActivityItem,
  type AssociatedRecords,
  type AtmosphereActivityPage,
  isGrainPhotoRecord,
  isLivestreamRecord,
  isRecommendRecord,
  isSubscriptionRecord,
} from '#/state/queries/atmosphereActivityTypes'

export type ActivityRowItem = {
  type: 'activity'
  key: string
  activity: ActivityItem
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}

export type ActivityGroupRowItem = {
  type: 'group'
  key: string
  group: ActivityGroup
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}

export type ActivityListItem =
  | ActivityRowItem
  | ActivityGroupRowItem
  | {type: 'loading'; key: 'loading'}
  | {type: 'empty'; key: 'empty'}
  | {type: 'error'; key: 'error'; error: string}

export type ActivityRowContent =
  | {
      type: 'recommendation'
      actorDid?: string
      actor: ActivityActor | undefined
      subjectDid: string
      subjectActor: ActivityActor | undefined
      title?: string
      href?: string
    }
  | {
      type: 'document'
      actorDid?: string
      actor: ActivityActor | undefined
      title?: string
      href?: string
    }
  | {
      type: 'publication'
      actorDid?: string
      actor: ActivityActor | undefined
      name?: string
      href?: string
    }
  | {
      type: 'subscription'
      actorDid?: string
      actor: ActivityActor | undefined
      name?: string
      href?: string
    }
  | {
      type: 'livestream'
      actorDid?: string
      actor: ActivityActor | undefined
      title?: string
      ended: boolean
      durationInMinutes?: number
    }
  | {
      type: 'photo'
      actorDid?: string
      actor: ActivityActor | undefined
      imageUri: string
      alt?: string
      aspectRatio: number
    }
  | {
      type: 'generic'
      actorDid?: string
      actor: ActivityActor | undefined
    }

export function buildActivityListItems(
  data: InfiniteData<AtmosphereActivityPage> | undefined,
  error?: string,
): ActivityListItem[] {
  if (!data) {
    return error
      ? [{type: 'error', key: 'error', error}]
      : [{type: 'loading', key: 'loading'}]
  }

  const associatedRecords: AssociatedRecords = {}
  const actors: ActivityActors = {}
  for (const page of data.pages) {
    Object.assign(associatedRecords, page.associatedRecords)
    Object.assign(actors, page.actors)
  }

  const seen = new Set<string>()
  const items: Array<ActivityRowItem | ActivityGroupRowItem> = []
  for (const page of data.pages) {
    for (const entry of page.feed) {
      if (entry.$type === 'eric.bsky.atmosphere.getActivity#group') {
        const groupItems = entry.items.filter(item => {
          if (seen.has(item.record.uri)) return false
          seen.add(item.record.uri)
          return true
        })
        if (groupItems.length === 0) continue
        if (groupItems.length === 1) {
          items.push({
            type: 'activity',
            key: groupItems[0].record.uri,
            activity: groupItems[0],
            associatedRecords,
            actors,
          })
          continue
        }
        items.push({
          type: 'group',
          key: entry.id,
          group: {...entry, items: groupItems},
          associatedRecords,
          actors,
        })
      } else {
        if (seen.has(entry.record.uri)) continue
        seen.add(entry.record.uri)
        items.push({
          type: 'activity',
          key: entry.record.uri,
          activity: entry,
          associatedRecords,
          actors,
        })
      }
    }
  }

  return items.length > 0 ? items : [{type: 'empty', key: 'empty'}]
}

export function getActivityRowContent({
  activity,
  associatedRecords,
  actors,
}: ActivityRowItem): ActivityRowContent {
  const root = parseAtUri(activity.record.uri)
  const actor = root ? actors[root.did] : undefined
  const generic: ActivityRowContent = {
    type: 'generic',
    actorDid: root?.did,
    actor,
  }
  if (!root) return generic

  const rootRecord = associatedRecords[activity.record.uri]?.record
  if (!rootRecord) return generic

  switch (root.collection) {
    case 'site.standard.graph.recommend': {
      if (!isRecommendRecord(rootRecord)) return generic
      const documentUri = parseAtUri(rootRecord.document)
      if (!documentUri) return generic
      const document = associatedRecords[rootRecord.document]?.record
      if (!document) return generic
      return {
        type: 'recommendation',
        actorDid: root.did,
        actor,
        subjectDid: documentUri.did,
        subjectActor: actors[documentUri.did],
        title: typeof document.title === 'string' ? document.title : undefined,
        href: getDocumentUrl(document, associatedRecords),
      }
    }
    case 'site.standard.document':
      return {
        type: 'document',
        actorDid: root.did,
        actor,
        title:
          typeof rootRecord.title === 'string' ? rootRecord.title : undefined,
        href: getDocumentUrl(rootRecord, associatedRecords),
      }
    case 'site.standard.publication':
      return {
        type: 'publication',
        actorDid: root.did,
        actor,
        name: typeof rootRecord.name === 'string' ? rootRecord.name : undefined,
        href: getWebUrl(rootRecord.url),
      }
    case 'site.standard.graph.subscription': {
      if (!isSubscriptionRecord(rootRecord)) return generic
      const publication = associatedRecords[rootRecord.publication]?.record
      if (!publication || !parseAtUri(rootRecord.publication)) return generic
      return {
        type: 'subscription',
        actorDid: root.did,
        actor,
        name:
          typeof publication.name === 'string' ? publication.name : undefined,
        href: getWebUrl(publication.url),
      }
    }
    case 'place.stream.livestream': {
      if (!isLivestreamRecord(rootRecord)) return generic
      const endedAt =
        typeof rootRecord.endedAt === 'string' ? rootRecord.endedAt : undefined
      return {
        type: 'livestream',
        actorDid: root.did,
        actor,
        title:
          typeof rootRecord.title === 'string' ? rootRecord.title : undefined,
        ended: Boolean(endedAt),
        durationInMinutes: endedAt
          ? getDurationInMinutes(rootRecord.createdAt, endedAt)
          : undefined,
      }
    }
    case 'social.grain.photo': {
      if (!isGrainPhotoRecord(rootRecord)) return generic
      const imageUri = getPhotoUrl(root.did, rootRecord.photo)
      if (!imageUri) return generic
      return {
        type: 'photo',
        actorDid: root.did,
        actor,
        imageUri,
        alt: typeof rootRecord.alt === 'string' ? rootRecord.alt : undefined,
        aspectRatio: getAspectRatio(rootRecord.aspectRatio),
      }
    }
    default:
      return generic
  }
}

export function getDocumentUrl(
  document: Record<string, unknown>,
  associatedRecords: AssociatedRecords,
): string | undefined {
  const site = typeof document.site === 'string' ? document.site : undefined
  if (!site) return undefined

  const publication = associatedRecords[site]?.record
  const baseUrl = site.startsWith('at://')
    ? getWebUrl(publication?.url)
    : getWebUrl(site)
  if (!baseUrl) return undefined

  const path = typeof document.path === 'string' ? document.path : ''
  try {
    return getWebUrl(new URL(path, ensureTrailingSlash(baseUrl)).href)
  } catch {
    return undefined
  }
}

function getPhotoUrl(
  did: string,
  photo: {ref: unknown; mimeType: string},
): string | undefined {
  const cid = getBlobCid(photo.ref)
  const extension = getImageExtension(photo.mimeType)
  if (!cid || !extension) return undefined
  return `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@${extension}`
}

function getBlobCid(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (typeof value !== 'object' || value === null) return undefined
  if ('$link' in value && typeof value.$link === 'string') return value.$link

  const toString = Reflect.get(value, 'toString')
  if (typeof toString !== 'function') return undefined
  const cid = Reflect.apply(toString, value, [])
  return typeof cid === 'string' && /^b[a-z2-7]+$/i.test(cid) ? cid : undefined
}

function getImageExtension(mimeType: string): string | undefined {
  switch (mimeType.toLowerCase()) {
    case 'image/jpeg':
      return 'jpeg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return undefined
  }
}

function getAspectRatio(value: unknown): number {
  if (
    typeof value === 'object' &&
    value !== null &&
    'width' in value &&
    'height' in value &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    value.width > 0 &&
    value.height > 0
  ) {
    return value.width / value.height
  }
  return 1
}

function getDurationInMinutes(
  createdAt: string,
  endedAt: string,
): number | undefined {
  const start = new Date(createdAt).getTime()
  const end = new Date(endedAt).getTime()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return undefined
  }
  return Math.max(1, (end - start) / 60_000)
}

function getWebUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : undefined
  } catch {
    return undefined
  }
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`
}

function parseAtUri(
  uri: string,
): {did: string; collection: string} | undefined {
  try {
    const parsed = new AtUri(uri)
    return {did: parsed.host, collection: parsed.collection}
  } catch {
    return undefined
  }
}
