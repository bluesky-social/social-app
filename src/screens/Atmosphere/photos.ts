import {AtUri, isValidDid} from '@atproto/syntax'
import {CID} from 'multiformats/cid'

import {getBlobUrl} from '#/screens/Atmosphere/externalViews'
import {type ActivityPresentationItem} from '#/screens/Atmosphere/presentation'
import {
  activityCollections,
  type GrainPhotoRecord,
  isGrainPhotoRecord,
} from '#/screens/Atmosphere/types'
import {type app} from '#/lexicons'

/** Gallery and lightbox share this cap; the original activity group stays intact. */
const MAX_GRAIN_PHOTOS = 10

export function getGrainPhotos(
  item: ActivityPresentationItem,
): app.bsky.embed.images.ViewImage[] {
  const activities =
    item.type === 'activity' ? [item.activity] : item.group.items

  const photos = activities.flatMap(activity => {
    if (activity.collection !== activityCollections.grainPhoto) return []

    const ownerDid = getOwnerDid(activity.record.uri)
    if (!ownerDid) return []

    const record = item.associatedRecords[activity.record.uri]?.record
    if (!isGrainPhotoRecord(record)) return []

    const cid = getBlobCid(record.photo.ref)
    if (!cid) return []

    const fullsize = getBlobUrl(ownerDid, {
      ref: cid,
      mimeType: record.photo.mimeType,
    })
    if (!fullsize) return []

    const aspectRatio = getAspectRatio(record.aspectRatio)

    return [
      {
        thumb: fullsize as app.bsky.embed.images.ViewImage['thumb'],
        fullsize: fullsize as app.bsky.embed.images.ViewImage['fullsize'],
        alt: typeof record.alt === 'string' ? record.alt : '',
        aspectRatio,
      },
    ]
  })
  return photos.slice(0, MAX_GRAIN_PHOTOS)
}

function getOwnerDid(uri: string): string | undefined {
  try {
    const parsed = new AtUri(uri)
    return parsed.collection === activityCollections.grainPhoto &&
      parsed.rkey &&
      isValidDid(parsed.host)
      ? parsed.host
      : undefined
  } catch {
    return undefined
  }
}

function getBlobCid(value: unknown): string | undefined {
  try {
    if (typeof value === 'string') return CID.parse(value).toString()
    if (!isObject(value)) return undefined
    if (typeof value.$link === 'string')
      return CID.parse(value.$link).toString()
    return CID.asCID(value)?.toString()
  } catch {
    return undefined
  }
}

function getAspectRatio(value: GrainPhotoRecord['aspectRatio']): {
  width: number
  height: number
} {
  if (!value) return {width: 1, height: 1}

  if (
    !Number.isFinite(value.width) ||
    !Number.isFinite(value.height) ||
    value.width <= 0 ||
    value.height <= 0
  ) {
    return {width: 1, height: 1}
  }

  const ratio = value.width / value.height
  if (!Number.isFinite(ratio) || ratio <= 0) return {width: 1, height: 1}

  return {width: value.width, height: value.height}
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
