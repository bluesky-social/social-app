import {ChatBskyConvoDefs} from '@atproto/api'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'

export type UserReactionInfo = {
  message: string
  createdAt: string
}

export function getReactionInfo({
  convo,
  currentAccountDid,
  i18n,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  currentAccountDid: string | undefined
  i18n: I18n
}): UserReactionInfo | null {
  if (!ChatBskyConvoDefs.isMessageAndReactionView(convo.lastReaction)) {
    return null
  }

  const {reaction, message: reactedTo} = convo.lastReaction
  const isFromMe = reaction.sender.did === currentAccountDid
  const senderDid = reaction.sender.did
  const sender = convo.members.find(m => m.did === senderDid)
  const name = sender ? createSanitizedDisplayName(sender) : null

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
  }
}
