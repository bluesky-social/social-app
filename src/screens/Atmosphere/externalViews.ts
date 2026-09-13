import {AtUri} from '@atproto/syntax'

import {type app} from '#/lexicons'
import {
  type ActivityActor,
  type ActivityActors,
  activityCollections,
  type AssociatedRecord,
  type AssociatedRecords,
  isDocumentRecord,
  isPublicationRecord,
} from './types'

export type PublicationBodyThemeColors = {
  custom: true
  accent: string
  accentForeground: string
}

export function createDocumentExternalView({
  uri,
  associatedRecords,
  actors,
}: {
  uri: string | undefined
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}): app.bsky.embed.external.ViewExternal | undefined {
  if (!uri) return undefined

  const document = associatedRecords[uri]
  const parsed = parseAtUri(uri)
  if (
    !document ||
    !parsed ||
    parsed.collection !== activityCollections.document ||
    !isDocumentRecord(document.record)
  ) {
    return undefined
  }

  return buildDocumentView(document, parsed.did, associatedRecords, actors)
}

export function createPublicationExternalView({
  uri,
  associatedRecords,
  actors,
}: {
  uri: string | undefined
  associatedRecords: AssociatedRecords
  actors: ActivityActors
}): app.bsky.embed.external.ViewExternal | undefined {
  if (!uri) return undefined

  const publication = associatedRecords[uri]
  const parsed = parseAtUri(uri)
  if (
    !publication ||
    !parsed ||
    parsed.collection !== activityCollections.publication ||
    !isPublicationRecord(publication.record)
  ) {
    return undefined
  }

  return buildPublicationView(publication, parsed.did, actors)
}

export function getPublicationBodyThemeColors(
  view: app.bsky.embed.external.ViewExternal,
): PublicationBodyThemeColors | undefined {
  const accentRGB = view.source?.theme?.accentRGB
  const accentForegroundRGB = view.source?.theme?.accentForegroundRGB
  if (!accentRGB || !accentForegroundRGB) {
    return undefined
  }

  return {
    custom: true,
    accent: rgbToHex(accentRGB.r, accentRGB.g, accentRGB.b),
    accentForeground: rgbToHex(
      accentForegroundRGB.r,
      accentForegroundRGB.g,
      accentForegroundRGB.b,
    ),
  }
}

function buildPublicationView(
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

function buildDocumentView(
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
    siteUri?.collection === activityCollections.publication &&
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
    description: getDocumentDescription(record),
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

  const $type = getString(value.$type)
  const theme = {
    ...($type ? {$type} : {}),
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

export function getBlobUrl(did: string, value: unknown): string | undefined {
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

function getDocumentDescription(record: Record<string, unknown>) {
  const description = getString(record.description)
  if (description?.trim()) return description

  return getString(record.textContent)?.replace(/\s+/g, ' ').trim() ?? ''
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getDocumentUrl(
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

function parseAtUri(uri: string) {
  try {
    const parsed = new AtUri(uri)
    return {did: parsed.host, collection: parsed.collection}
  } catch {
    return undefined
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function toHex(value: number) {
  return value.toString(16).padStart(2, '0')
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
