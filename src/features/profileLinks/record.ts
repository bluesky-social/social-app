import {type BlobRef, getBlobMime, isBlobRef} from '@atproto/lex'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {isBlockedProfileLink, normalizeProfileLinkUrl} from './providers'
import {MAX_PROFILE_LINKS, MAX_TITLE_LENGTH, type ProfileLink} from './types'

/*
 * Beta storage: links live in unofficial fields on the profile record, with
 * local types and no lexicon. The names must not be reused by the GA profile
 * field, or profiles that still carry beta data would fail validation.
 */
const LINKS_FIELD = 'betaLinks'
const GERM_INDEX_FIELD = 'betaLinksGermIndex'

export type ProfileLinksData = {
  links: ProfileLink[]
  /** Position of the Germ DM button among the links. */
  germIndex: number
}

/**
 * Reads the beta links off a profile record. Any client can write these
 * fields, so entries that aren't usable web links are skipped.
 */
export function parseProfileRecordLinks(record: unknown): ProfileLinksData {
  if (!record || typeof record !== 'object') {
    return {links: [], germIndex: 0}
  }
  const fields = record as Record<string, unknown>
  const rawLinks = fields[LINKS_FIELD]
  const rawGermIndex = fields[GERM_INDEX_FIELD]

  const links: ProfileLink[] = []
  const seen = new Set<string>()
  if (Array.isArray(rawLinks)) {
    for (const raw of rawLinks) {
      if (links.length >= MAX_PROFILE_LINKS) break
      if (!raw || typeof raw !== 'object') continue
      const {uri, title, icon} = raw as {
        uri?: unknown
        title?: unknown
        icon?: unknown
      }
      if (typeof uri !== 'string') continue
      const normalized = normalizeProfileLinkUrl(uri)
      if (
        !normalized ||
        seen.has(normalized) ||
        isBlockedProfileLink(normalized)
      ) {
        continue
      }
      seen.add(normalized)
      // keep the stored value as written, unless it can't be opened as is
      const url = /^https?:\/\//i.test(uri) ? uri : normalized
      const trimmedTitle =
        typeof title === 'string' ? truncateTitle(title.trim()) : ''
      const link: ProfileLink = {url}
      if (trimmedTitle) link.title = trimmedTitle
      if (isIconBlob(icon)) link.icon = icon
      links.push(link)
    }
  }

  const germIndex =
    typeof rawGermIndex === 'number' &&
    Number.isInteger(rawGermIndex) &&
    rawGermIndex >= 0
      ? rawGermIndex
      : 0
  return {links, germIndex}
}

/**
 * Returns the profile record with its beta links replaced. Removes the fields
 * when there are no links, so profiles without links stay unchanged.
 */
export function withProfileRecordLinks<T extends object>(
  record: T,
  {links, germIndex}: ProfileLinksData,
): T {
  const next = {...record} as Record<string, unknown>
  delete next[LINKS_FIELD]
  delete next[GERM_INDEX_FIELD]
  if (links.length > 0) {
    next[LINKS_FIELD] = links.map(link => {
      const entry: {uri: string; title?: string; icon?: BlobRef} = {
        uri: link.url,
      }
      if (link.title) entry.title = link.title
      if (link.icon) entry.icon = link.icon
      return entry
    })
    if (germIndex > 0) next[GERM_INDEX_FIELD] = germIndex
  }
  return next as T
}

/**
 * Only raster images we'd show; cardyb always serves PNG, but any client can
 * write these fields.
 */
function isIconBlob(value: unknown): value is BlobRef {
  if (!isBlobRef(value, {strict: false})) return false
  const mime = getBlobMime(value)
  return mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp'
}

/** Cuts by characters, so an emoji is never split in half. */
export function truncateTitle(title: string): string {
  const graphemes = Array.from(splitGraphemes(title))
  if (graphemes.length <= MAX_TITLE_LENGTH) return title
  return graphemes.slice(0, MAX_TITLE_LENGTH).join('').trim()
}
