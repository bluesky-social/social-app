import {useSession} from '#/state/session'
import {device, useStorage} from '#/storage'
import type * as bsky from '#/types/bsky'
import {
  findSupportUriInText,
  isSupportLink,
  normalizeSupportUri,
} from './providers'
import {type SupportLink} from './types'

/*
 * Prototype persistence. There is no lexicon for this yet, so links live in
 * device storage keyed by DID. Swap this file for a record-backed query when
 * the data model lands; the hooks below are the only surface the UI touches.
 */

function useSupportLinks() {
  const [links = {}, setLinks] = useStorage(device, ['supportLinks'])
  return [links, setLinks] as const
}

/**
 * The support link to show for a profile. Prefers an explicitly saved link,
 * then falls back to a recognized provider URL found in the bio so the
 * prototype lights up on real creator profiles without any setup.
 */
export function useSupportLink(
  profile: bsky.profile.AnyProfileView | undefined,
): SupportLink | null {
  const [links] = useSupportLinks()
  if (!profile) return null
  const saved = links[profile.did]
  if (saved) return saved

  const description =
    'description' in profile ? (profile.description as string) : undefined
  const derived = findSupportUriInText(description)
  if (!derived) return null
  return {uri: derived, verb: 'support', createdAt: ''}
}

/**
 * The current account's saved support link, plus setters. Only the explicit
 * save counts here - a bio-derived link is a display fallback, not something
 * the owner has opted into.
 */
export function useMySupportLink() {
  const {currentAccount} = useSession()
  const [links, setLinks] = useSupportLinks()
  const did = currentAccount?.did
  const link = did ? (links[did] ?? null) : null

  const save = (uri: string) => {
    if (!did) return
    setLinks({
      ...links,
      [did]: {uri, verb: 'support', createdAt: new Date().toISOString()},
    })
  }

  const remove = () => {
    if (!did) return
    const next = {...links}
    delete next[did]
    setLinks(next)
  }

  return {link, save, remove}
}

/**
 * Whether a link in a post should render as a Support card: a recognized
 * provider, or exactly the link this author saved as their Support button.
 * Any other link stays an ordinary link card.
 */
export function useIsSupportEmbed(
  author: bsky.profile.AnyProfileView | undefined,
  uri: string | undefined,
): boolean {
  const link = useSupportLink(author)
  if (!uri) return false
  if (isSupportLink(uri)) return true
  if (!link) return false
  return normalizeSupportUri(link.uri) === normalizeSupportUri(uri)
}
