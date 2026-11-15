import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {isBlockedOrBlocking} from '#/lib/moderation/blocked-and-muted'
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {
  postUriToRelativePath,
  toBskyAppUrl,
  toShortUrl,
} from '#/lib/strings/url-helpers'
import {app, chat} from '#/lexicons'
import * as bsky from '#/types/bsky'

export type UserMessageInfo = {
  message: string | null
  sentAt: string
  reportableMessage?: chat.bsky.convo.defs.MessageView
  isBlockedMessage: boolean
}

/**
 * Resolves whether the given did is blocked (in either direction) within a
 * convo. Prefers the passed-in shadowed `primaryProfile` so optimistic blocks
 * reflect immediately, before the convo list refetches - the raw `members`
 * fetched with the convo are invisible to the profile shadow cache. Group
 * members other than the owner fall back to the raw (potentially stale) member.
 */
export function isDidBlockedInConvo({
  did,
  members,
  primaryProfile,
}: {
  did: string | undefined
  members: chat.bsky.actor.defs.ProfileViewBasic[]
  primaryProfile?: bsky.profile.AnyProfileView
}): boolean {
  if (!did) return false
  if (primaryProfile && primaryProfile.did === did) {
    return isBlockedOrBlocking(primaryProfile)
  }
  const member = members.find(m => m.did === did)
  return member ? isBlockedOrBlocking(member) : false
}

export function getMessageInfo({
  convo,
  currentAccountDid,
  primaryProfile,
  i18n,
}: {
  convo: chat.bsky.convo.defs.ConvoView
  currentAccountDid: string | undefined
  primaryProfile?: bsky.profile.AnyProfileView
  i18n: I18n
}): UserMessageInfo | null {
  if (!bsky.isType(chat.bsky.convo.defs.messageView, convo.lastMessage)) {
    return null
  }

  const lastMessage = convo.lastMessage
  const isFromMe = lastMessage.sender?.did === currentAccountDid
  const senderDid = lastMessage.sender?.did
  const sender = convo.members.find(m => m.did === senderDid)
  const name = sender ? createSanitizedDisplayName(sender) : null
  const isGroup = bsky.isType(chat.bsky.convo.defs.groupConvo, convo.kind)

  const reportableMessage = isFromMe ? undefined : lastMessage
  const isBlockedMessage = isDidBlockedInConvo({
    did: senderDid,
    members: convo.members,
    primaryProfile,
  })

  const prefix = (message: string) => {
    if (isFromMe) {
      return i18n._(
        msg({
          message: `You: ${message}`,
          comment: 'When the last message in a chat was made by you.',
        }),
      )
    } else if (isGroup && name) {
      return i18n._(
        msg({
          message: `${name}: ${message}`,
          comment:
            'When the last message in a group chat came from someone other than you.',
        }),
      )
    }
    return message
  }

  let message: string | null = null

  if (lastMessage.text) {
    message = prefix(lastMessage.text)
  } else if (lastMessage.embed) {
    const defaultEmbeddedContentMessage = i18n._(
      msg`(contains embedded content)`,
    )

    if (bsky.isType(app.bsky.embed.record.view, lastMessage.embed)) {
      const embed = lastMessage.embed

      if (bsky.isType(app.bsky.embed.record.viewRecord, embed.record)) {
        const record = embed.record
        const path = postUriToRelativePath(record.uri, {
          handle: record.author.handle,
        })
        const href = path ? toBskyAppUrl(path) : undefined
        const short = href ? toShortUrl(href) : defaultEmbeddedContentMessage
        message = prefix(short)
      } else {
        message = prefix(defaultEmbeddedContentMessage)
      }
    } else if (bsky.isType(chat.bsky.embed.joinLink.view, lastMessage.embed)) {
      message = prefix(i18n._(msg`(chat invite link)`))
    } else {
      message = prefix(defaultEmbeddedContentMessage)
    }
  }

  return {
    message,
    sentAt: lastMessage.sentAt,
    reportableMessage,
    isBlockedMessage,
  }
}
