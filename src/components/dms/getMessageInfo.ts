import {AppBskyEmbedRecord, ChatBskyConvoDefs} from '@atproto/api'
import {type I18n} from '@lingui/core'
import {msg} from '@lingui/core/macro'

import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {
  postUriToRelativePath,
  toBskyAppUrl,
  toShortUrl,
} from '#/lib/strings/url-helpers'

export type UserMessageInfo = {
  message: string | null
  sentAt: string
  reportableMessage?: ChatBskyConvoDefs.MessageView
}

export function getMessageInfo({
  convo,
  currentAccountDid,
  i18n,
}: {
  convo: ChatBskyConvoDefs.ConvoView
  currentAccountDid: string | undefined
  i18n: I18n
}): UserMessageInfo | null {
  if (!ChatBskyConvoDefs.isMessageView(convo.lastMessage)) {
    return null
  }

  const lastMessage = convo.lastMessage
  const isFromMe = lastMessage.sender?.did === currentAccountDid
  const senderDid = lastMessage.sender?.did
  const sender = convo.members.find(m => m.did === senderDid)
  const name = sender ? createSanitizedDisplayName(sender) : null
  const isGroup = ChatBskyConvoDefs.isGroupConvo(convo.kind)

  const reportableMessage = isFromMe ? undefined : lastMessage

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

    if (AppBskyEmbedRecord.isView(lastMessage.embed)) {
      const embed = lastMessage.embed

      if (AppBskyEmbedRecord.isViewRecord(embed.record)) {
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
    } else {
      message = prefix(defaultEmbeddedContentMessage)
    }
  }

  return {
    message,
    sentAt: lastMessage.sentAt,
    reportableMessage,
  }
}
