import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {isDidBlockedInConvo} from '#/components/dms/getMessageInfo'
import {chat} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type UserReactionInfo = {
  message: string
  createdAt: string
  isBlocked: boolean
}

export function getReactionInfo({
  convo,
  currentAccountDid,
  primaryProfile,
  i18n,
}: {
  convo: chat.bsky.convo.defs.ConvoView
  currentAccountDid: string | undefined
  primaryProfile?: bsky.profile.AnyProfileView
  i18n: I18n
}): UserReactionInfo | null {
  if (
    !bsky.isType(
      chat.bsky.convo.defs.messageAndReactionView,
      convo.lastReaction,
    )
  ) {
    return null
  }

  const {reaction, message: reactedTo} = convo.lastReaction
  const isFromMe = reaction.sender.did === currentAccountDid
  const senderDid = reaction.sender.did
  const sender = convo.members.find(m => m.did === senderDid)
  const name = sender ? createSanitizedDisplayName(sender) : null

  // Hide the preview when either the reactor or the author of the reacted-to
  // message is blocked - otherwise a blocked reactor's name or a blocked
  // sender's message text would leak into the chat list.
  const isBlocked =
    isDidBlockedInConvo({
      did: senderDid,
      members: convo.members,
      primaryProfile,
    }) ||
    isDidBlockedInConvo({
      did: reactedTo.sender?.did,
      members: convo.members,
      primaryProfile,
    })

  const lastMessageText = reactedTo.text
  const fallbackMessage = i18n._(
    msg({
      message: 'a message',
      comment:
        'If last message does not contain text, fall back to "{user} reacted to {a message}"',
    }),
  )
  const target = lastMessageText ? `"${lastMessageText}"` : fallbackMessage

  let message: string
  if (isFromMe) {
    message = i18n._(msg`You reacted ${reaction.value} to ${target}`)
  } else if (name) {
    message = i18n._(msg`${name} reacted ${reaction.value} to ${target}`)
  } else {
    message = i18n._(msg`Someone reacted ${reaction.value} to ${target}`)
  }

  return {
    message,
    createdAt: reaction.createdAt,
    isBlocked,
  }
}
