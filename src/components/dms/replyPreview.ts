import {useLingui} from '@lingui/react/macro'

import {BSKY_APP_HOST, toShortUrl} from '#/lib/strings/url-helpers'
import * as AppBskyEmbedExternal from '#/lexicons/app/bsky/embed/external'
import * as AppBskyEmbedRecord from '#/lexicons/app/bsky/embed/record'
import type * as ChatBskyConvoDefs from '#/lexicons/chat/bsky/convo/defs'
import * as ChatBskyEmbedJoinLink from '#/lexicons/chat/bsky/embed/joinLink'
import * as ChatBskyGroupDefs from '#/lexicons/chat/bsky/group/defs'
import * as bsky from '#/types/bsky'

/**
 * Describes the embed of a quoted message that has no text of its own, so the
 * reply preview can show what was shared instead of a generic placeholder. For
 * a link card we surface the URI directly; otherwise we classify the quoted
 * record (post/feed/list/etc.) so the caller can render a translated label.
 */
type ReplyEmbedSummary =
  {type: 'external'; uri: string} | {type: 'post'} | {type: 'unknown'}

function summarizeReplyEmbed(
  embed: ChatBskyConvoDefs.MessageView['embed'],
): ReplyEmbedSummary {
  if (!bsky.isType(AppBskyEmbedRecord.view, embed)) return {type: 'unknown'}
  const {record} = embed
  if (bsky.isType(AppBskyEmbedRecord.viewRecord, record)) {
    const inner = record.embeds?.[0]
    if (bsky.isType(AppBskyEmbedExternal.view, inner)) {
      return {type: 'external', uri: inner.external.uri}
    }
    return {type: 'post'}
  }
  return {type: 'unknown'}
}

/**
 * Returns a formatter that computes the preview text for a message being quoted
 * in a reply, shared between the staged-reply composer and the sent reply
 * bubble so the two stay in sync. When the message has its own text we use it
 * verbatim; otherwise we summarize the embed.
 *
 * `subtle` indicates the text is a placeholder (not real message content), so
 * callers can render it in a muted/italic style.
 */
export function useReplyPreviewText(): (
  message: ChatBskyConvoDefs.MessageView,
) => {text: string; subtle: boolean} {
  const {t: l} = useLingui()

  return (message: ChatBskyConvoDefs.MessageView) => {
    const text = message.text
    if (text.trim()) {
      return {text, subtle: false}
    }

    if (bsky.isType(ChatBskyEmbedJoinLink.view, message.embed)) {
      const {joinLinkPreview} = message.embed
      if (bsky.isType(ChatBskyGroupDefs.joinLinkPreviewView, joinLinkPreview)) {
        return {
          text: `${BSKY_APP_HOST}/chat/${joinLinkPreview.code}`,
          subtle: true,
        }
      }
      if (
        bsky.isType(
          ChatBskyGroupDefs.disabledJoinLinkPreviewView,
          joinLinkPreview,
        )
      ) {
        return {
          text: l({
            message: '(disabled chat invite link)',
            comment: 'A reply summary in chat',
          }),
          subtle: true,
        }
      }
      if (
        bsky.isType(
          ChatBskyGroupDefs.invalidJoinLinkPreviewView,
          joinLinkPreview,
        )
      ) {
        return {
          text: l({
            message: '(invalid chat invite link)',
            comment: 'A reply summary in chat',
          }),
          subtle: true,
        }
      }
      return {
        text: l({
          message: '(chat invite link)',
          comment: 'A reply summary in chat',
        }),
        subtle: true,
      }
    }

    const summary = summarizeReplyEmbed(message.embed)
    switch (summary.type) {
      case 'external':
        return {text: toShortUrl(summary.uri), subtle: true}
      case 'post':
        return {
          text: l({
            message: '(quoted post)',
            comment: 'A reply summary in chat',
          }),
          subtle: true,
        }
      default:
        return {
          text: l({message: '(no text)', comment: 'A reply summary in chat'}),
          subtle: true,
        }
    }
  }
}
