import {getBlobCidString} from '@atproto/lex'
import {moderateProfileLink, type ModerationOpts} from '@bsky/sdk/moderation'
import {splitGraphemes} from 'unicode-segmenter/grapheme'

import {type app} from '#/lexicons'
import {
  isBlockedProfileLink,
  isInsecureLink,
  isShortenerLink,
  normalizeProfileLinkUrl,
} from './providers'
import {MAX_PROFILE_LINKS, MAX_TITLE_LENGTH, type ProfileLink} from './types'

/**
 * Whether a link can be shown. The AppView applies the same rules, but any
 * client can write link records, so the app checks again.
 */
function isShowable(url: string, seen: Set<string>): boolean {
  const normalized = normalizeProfileLinkUrl(url)
  if (
    !normalized ||
    seen.has(normalized) ||
    isBlockedProfileLink(normalized) ||
    isShortenerLink(normalized) ||
    isInsecureLink(normalized)
  ) {
    return false
  }
  seen.add(normalized)
  return true
}

/**
 * Drops links the viewer's moderation settings hide, like a link labeled as
 * adult content for someone who hasn't enabled it. A link button can't show a
 * warning, so a label that would blur it hides it instead.
 */
export function filterModeratedLinkViews(
  views: app.bsky.actor.defs.ProfileLinkView[] | undefined,
  moderationOpts: ModerationOpts,
): app.bsky.actor.defs.ProfileLinkView[] | undefined {
  return views?.filter(view => {
    const ui = moderateProfileLink(view, moderationOpts).ui('contentList')
    return !ui.filter && !ui.blur
  })
}

/** The links in a profile view, in display order. */
export function linksFromProfileView(
  views: app.bsky.actor.defs.ProfileLinkView[] | undefined,
): ProfileLink[] {
  const links: ProfileLink[] = []
  const seen = new Set<string>()
  for (const view of views ?? []) {
    if (links.length >= MAX_PROFILE_LINKS) break
    if (!isShowable(view.url, seen)) continue
    const link: ProfileLink = {url: view.url, uri: view.uri, cid: view.cid}
    const title = view.title ? truncateTitle(view.title.trim()) : ''
    if (title) link.title = title
    if (view.icon) link.iconUrl = view.icon
    links.push(link)
  }
  return links
}

/**
 * The owner's links straight from their repo, in the order the profile lists
 * them. Used by the editor, which needs the stored icons to save them back.
 */
export function linksFromRecords(
  refs: {uri: string; cid: string}[] | undefined,
  records: {uri: string; cid: string; value: app.bsky.actor.link.Main}[],
): ProfileLink[] {
  const byUri = new Map(records.map(record => [record.uri, record]))
  const links: ProfileLink[] = []
  const seen = new Set<string>()
  for (const ref of refs ?? []) {
    if (links.length >= MAX_PROFILE_LINKS) break
    const record = byUri.get(ref.uri)
    if (!record || !isShowable(record.value.url, seen)) continue
    const link: ProfileLink = {
      url: record.value.url,
      uri: record.uri,
      cid: record.cid,
    }
    const title = record.value.title
      ? truncateTitle(record.value.title.trim())
      : ''
    if (title) link.title = title
    if (record.value.icon) link.icon = record.value.icon
    links.push(link)
  }
  return links
}

/** Cuts by characters, so an emoji is never split in half. */
export function truncateTitle(title: string): string {
  const graphemes = Array.from(splitGraphemes(title))
  if (graphemes.length <= MAX_TITLE_LENGTH) return title
  return graphemes.slice(0, MAX_TITLE_LENGTH).join('').trim()
}

/** Whether saving `a` over `b` would change anything. */
export function sameProfileLinks(a: ProfileLink[], b: ProfileLink[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (link, i) =>
        link.url === b[i].url &&
        link.title === b[i].title &&
        link.uri === b[i].uri &&
        (link.icon && getBlobCidString(link.icon)) ===
          (b[i].icon && getBlobCidString(b[i].icon)),
    )
  )
}
