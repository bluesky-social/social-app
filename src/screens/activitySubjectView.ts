import {AtUri} from '@atproto/syntax'

import {
  type ActivityActor,
  type ActivityActors,
  type AssociatedRecord,
  type AssociatedRecords,
  isDocumentRecord,
  isPublicationRecord,
} from '#/state/queries/atmosphereActivityTypes'
import {getDocumentUrl} from '#/screens/activityModel'
import {type app} from '#/lexicons'

export function createActivitySubjectView({
  uri,
  associatedRecords,
  actors,
}: {
  uri: string | undefined
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}): app.bsky.embed.external.ViewExternal | undefined {
  if (!uri) return undefined

  const subject = associatedRecords[uri]
  const parsed = parseAtUri(uri)
  if (!subject || !parsed) return undefined

  if (
    parsed.collection === 'site.standard.publication' &&
    isPublicationRecord(subject.record)
  ) {
    return createPublicationView(subject, parsed.did, actors)
  }

  if (
    parsed.collection === 'site.standard.document' &&
    isDocumentRecord(subject.record)
  ) {
    return createDocumentView(subject, parsed.did, associatedRecords, actors)
  }

  return undefined
}

function createPublicationView(
  publication: AssociatedRecord,
  did: string,
  actors: ActivityActors,
): app.bsky.embed.external.ViewExternal | undefined {
  const record = publication.record
  if (!isPublicationRecord(record)) return undefined

  const uri = getWebUrl(record.url)
  if (!uri) return undefined

  return {
    $type: 'app.bsky.embed.external#viewExternal',
    uri,
    title: record.name,
    description: getString(record.description) ?? '',
    source: createPublicationSource(publication, did),
    associatedRefs: [toStrongRef(publication)],
    associatedProfiles: getProfiles([did], actors),
  } as app.bsky.embed.external.ViewExternal
}

function createDocumentView(
  document: AssociatedRecord,
  did: string,
  associatedRecords: AssociatedRecords,
  actors: ActivityActors,
): app.bsky.embed.external.ViewExternal | undefined {
  const record = document.record
  if (!isDocumentRecord(record)) return undefined

  const uri = getDocumentUrl(record, associatedRecords)
  if (!uri) return undefined

  const site = associatedRecords[record.site]
  const siteUri = site ? parseAtUri(site.uri) : undefined
  const publication =
    site &&
    siteUri?.collection === 'site.standard.publication' &&
    isPublicationRecord(site.record)
      ? site
      : undefined
  const refs = [document]
  const profileDids = [did]
  if (publication && siteUri) {
    refs.push(publication)
    profileDids.push(siteUri.did)
  }

  return {
    $type: 'app.bsky.embed.external#viewExternal',
    uri,
    thumb: getBlobUrl(did, record.coverImage),
    title: record.title,
    description:
      getString(record.description) ?? getString(record.textContent) ?? '',
    source:
      publication && siteUri
        ? createPublicationSource(publication, siteUri.did)
        : undefined,
    createdAt: record.publishedAt,
    updatedAt: getString(record.updatedAt),
    associatedRefs: refs.map(toStrongRef),
    associatedProfiles: getProfiles(profileDids, actors),
  } as app.bsky.embed.external.ViewExternal
}

function createPublicationSource(publication: AssociatedRecord, did: string) {
  const record = publication.record
  if (!isPublicationRecord(record)) return undefined

  const uri = getWebUrl(record.url)
  if (!uri) return undefined

  return {
    $type: 'app.bsky.embed.external#viewExternalSource' as const,
    uri,
    icon: getBlobUrl(did, record.icon),
    title: record.name,
    description: getString(record.description),
    theme: getTheme(record.basicTheme),
  }
}

function getProfiles(dids: string[], actors: ActivityActors) {
  const seen = new Set<string>()
  return dids.flatMap(did => {
    const actor = actors[did]
    if (!actor || seen.has(actor.did)) return []
    seen.add(actor.did)
    return [toProfileView(actor)]
  })
}

function toProfileView(actor: ActivityActor) {
  return actor as app.bsky.actor.defs.ProfileViewBasic
}

function toStrongRef(record: AssociatedRecord) {
  return {uri: record.uri, cid: record.cid}
}

function getTheme(value: unknown) {
  if (!isObject(value)) return undefined

  const theme = {
    accentRGB: getRgb(value.accent),
    backgroundRGB: getRgb(value.background),
    foregroundRGB: getRgb(value.foreground),
    accentForegroundRGB: getRgb(value.accentForeground),
  }
  return Object.values(theme).some(Boolean) ? theme : undefined
}

function getRgb(value: unknown) {
  if (
    !isObject(value) ||
    !isRgbChannel(value.r) ||
    !isRgbChannel(value.g) ||
    !isRgbChannel(value.b)
  ) {
    return undefined
  }
  return {r: value.r, g: value.g, b: value.b}
}

function isRgbChannel(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 255
}

function getBlobUrl(did: string, value: unknown): string | undefined {
  if (!isObject(value) || typeof value.mimeType !== 'string') return undefined

  const cid = getBlobCid(value.ref)
  const extension = getImageExtension(value.mimeType)
  if (!cid || !extension) return undefined
  return `https://cdn.bsky.app/img/feed_fullsize/plain/${did}/${cid}@${extension}`
}

function getBlobCid(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (!isObject(value)) return undefined
  if (typeof value.$link === 'string') return value.$link

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

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
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

function parseAtUri(uri: string) {
  try {
    const parsed = new AtUri(uri)
    return {did: parsed.host, collection: parsed.collection}
  } catch {
    return undefined
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
