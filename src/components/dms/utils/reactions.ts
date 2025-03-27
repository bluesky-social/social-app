import {type ChatBskyConvoDefs} from '@atproto/api'

import {EMOJI_REACTION_LIMIT} from '#/lib/constants'

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
