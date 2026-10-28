import {type MessageDescriptor} from '@lingui/core'
import {msg} from '@lingui/core/macro'

/**
 * The parts of a profile that can be shown one at a time under its tabs.
 *
 * These are keys rather than indexes because which tabs exist changes with the
 * account (a labeler has labels and lists, someone with no custom feeds has no
 * feeds tab), and indexes computed from that change were easy to get out of
 * step with the tabs actually drawn.
 */
export type ProfileTabKey =
  | 'labels'
  | 'lists'
  | 'posts'
  | 'replies'
  | 'media'
  | 'videos'
  | 'likes'
  | 'feeds'
  | 'starterPacks'

export const profileTabMessages: Record<ProfileTabKey, MessageDescriptor> = {
  labels: msg`Labels`,
  lists: msg`Lists`,
  posts: msg`Posts`,
  replies: msg`Replies`,
  media: msg`Media`,
  videos: msg`Videos`,
  likes: msg`Likes`,
  feeds: msg`Feeds`,
  starterPacks: msg`Starter Packs`,
}

export type ProfileTabVisibility = {
  hasSession: boolean
  /** Whether the reader is looking at their own profile. */
  isMe: boolean
  /** A moderation service: it has labels and moderation lists instead of media. */
  hasLabeler: boolean
  /** Lists the account has made, with the Starter Packs it has taken out. */
  listCount: number
  feedCount: number
  starterPackCount: number
}

/**
 * The tabs a profile shows, in order.
 *
 * A labeler's lists sit next to its labels, because they are part of how it
 * moderates, rather than at the end beside its Starter Packs where an ordinary
 * account's lists go.
 */
export function profileTabKeys({
  hasSession,
  isMe,
  hasLabeler,
  listCount,
  feedCount,
  starterPackCount,
}: ProfileTabVisibility): ProfileTabKey[] {
  const showsLists = hasSession && (isMe || listCount > 0)
  const keys: ProfileTabKey[] = []

  if (hasLabeler) {
    keys.push('labels')
    if (showsLists) keys.push('lists')
  }

  keys.push('posts')
  if (hasSession) keys.push('replies')
  if (!hasLabeler) keys.push('media', 'videos')
  if (isMe) keys.push('likes')
  if (isMe || feedCount > 0) keys.push('feeds')
  if (isMe || starterPackCount > 0) keys.push('starterPacks')
  if (!hasLabeler && showsLists) keys.push('lists')

  return keys
}
