import {createContext, useContext, useMemo} from 'react'

import type * as bsky from '#/types/bsky'
import {useIsSupportEmbed} from './storage'

/*
 * DEV-ONLY DEMO DATA. Bluesky never sees the payment, so there is no real list
 * of who supports a creator. These canned lists map a creator's handle to the
 * people shown as their supporters, using real accounts so the prototype looks
 * right. For the thread badge to be visible, the supporter handles include
 * people who actually reply on that creator's Support post. Remove before
 * merging.
 */
export const DEMO_SUPPORTERS: Record<
  string,
  {handles: string[]; count: number}
> = __DEV__
  ? {
      'misternuma.bsky.social': {
        handles: ['darrin.bsky.team', 'gh-fg.bsky.social', 'bsky.app'],
        count: 12,
      },
      'furryli.st': {
        handles: [
          'jebello.bsky.social',
          'malachyte.bsky.social',
          'ashevixen.bsky.social',
          'foxarc.bsky.social',
          'reilukah.bsky.social',
        ],
        count: 214,
      },
    }
  : {}

type SupportThreadValue = {supporterHandles: Set<string>}

const SupportThreadContext = createContext<SupportThreadValue | null>(null)

/**
 * Marks the surrounding post thread as the thread of a creator's Support post,
 * so avatars inside it can show a supporter badge. When the anchor post is not
 * a Support post this provides `null`, so the badge only ever appears in the
 * thread of a Support link - nowhere else in the app.
 */
export function SupportThreadProvider({
  anchor,
  children,
}: {
  /** The thread's anchor (root) post view. */
  anchor?: {
    author?: bsky.profile.AnyProfileView
    embed?: {$type?: string}
  }
  children: React.ReactNode
}) {
  const author = anchor?.author
  const embed = anchor?.embed
  const externalUri =
    embed && embed.$type === 'app.bsky.embed.external#view'
      ? (embed as {external?: {uri?: string}}).external?.uri
      : undefined
  const isSupportThread = useIsSupportEmbed(author, externalUri)

  const value = useMemo<SupportThreadValue | null>(() => {
    if (!isSupportThread || !author) return null
    const demo = DEMO_SUPPORTERS[author.handle]
    return {supporterHandles: new Set(demo?.handles ?? [])}
  }, [isSupportThread, author])

  return (
    <SupportThreadContext.Provider value={value}>
      {children}
    </SupportThreadContext.Provider>
  )
}

/**
 * Whether this profile should show the supporter badge in the current thread.
 * False everywhere outside a Support post's thread.
 */
export function useIsThreadSupporter(
  profile: bsky.profile.AnyProfileView | undefined,
): boolean {
  const ctx = useContext(SupportThreadContext)
  if (!ctx || !profile) return false
  return ctx.supporterHandles.has(profile.handle)
}
