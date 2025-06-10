import {type ChatBskyConvoDefs} from '@atproto/api'

import {EMOJI_REACTION_LIMIT} from '#/lib/constants'
import type * as bsky from '#/types/bsky'

export function canBeMessaged(profile: bsky.profile.AnyProfileView) {
  switch (profile.associated?.chat?.allowIncoming) {
    case 'none':
      return false
    case 'all':
      return true
    // if unset, treat as following
    case 'following':
    case undefined:
      return Boolean(profile.viewer?.followedBy)
    // any other values are invalid according to the lexicon, so
    // let's treat as false to be safe
    default:
      return false
  }
}

export function localDateString(date: Date) {
  // can't use toISOString because it should be in local time
  const mm = date.getMonth()
  const dd = date.getDate()
  const yyyy = date.getFullYear()
  // not padding with 0s because it's not necessary, it's just used for comparison
  return `${yyyy}-${mm}-${dd}`
}

export function hasAlreadyReacted(
  message: ChatBskyConvoDefs.MessageView,
  myDid: string | undefined,
  emoji: string,
): boolean {
  if (!message.reactions) {
    return false
  }
  return !!message.reactions.find(
    reaction => reaction.value === emoji && reaction.sender.did === myDid,
  )
}

export function hasReachedReactionLimit(
  message: ChatBskyConvoDefs.MessageView,
  myDid: string | undefined,
): boolean {
  if (!message.reactions) {
    return false
  }
  const myReactions = message.reactions.filter(
    reaction => reaction.sender.did === myDid,
  )
  return myReactions.length >= EMOJI_REACTION_LIMIT
}
