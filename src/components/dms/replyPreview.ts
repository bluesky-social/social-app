import {
  AppBskyEmbedExternal,
  AppBskyEmbedRecord,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyLabelerDefs,
  type ChatBskyConvoDefs,
  ChatBskyEmbedJoinLink,
} from '@atproto/api'
import {useLingui} from '@lingui/react/macro'

import {BSKY_APP_HOST, toShortUrl} from '#/lib/strings/url-helpers'
import {isKnownJoinLinkPreview} from '#/state/queries/join-links'

/**
 * Describes the embed of a quoted message that has no text of its own, so the
 * reply preview can show what was shared instead of a generic placeholder. For
 * a link card we surface the URI directly; otherwise we classify the quoted
 * record (post/feed/list/etc.) so the caller can render a translated label.
 */
type ReplyEmbedSummary =
  | {type: 'external'; uri: string}
  | {type: 'post'}
  | {type: 'feed'}
  | {type: 'list'}
  | {type: 'starterPack'}
  | {type: 'labeler'}
  | {type: 'unknown'}

function summarizeReplyEmbed(
  embed: ChatBskyConvoDefs.MessageView['embed'],
): ReplyEmbedSummary {
  if (!AppBskyEmbedRecord.isView(embed)) return {type: 'unknown'}
  const {record} = embed
  if (AppBskyEmbedRecord.isViewRecord(record)) {
    const inner = record.embeds?.[0]
    if (AppBskyEmbedExternal.isView(inner)) {
      return {type: 'external', uri: inner.external.uri}
    }
    return {type: 'post'}
  }
  if (AppBskyFeedDefs.isGeneratorView(record)) return {type: 'feed'}
  if (AppBskyGraphDefs.isListView(record)) return {type: 'list'}
  if (AppBskyGraphDefs.isStarterPackViewBasic(record)) {
    return {type: 'starterPack'}
  }
  if (AppBskyLabelerDefs.isLabelerView(record)) return {type: 'labeler'}
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

    if (ChatBskyEmbedJoinLink.isView(message.embed)) {
      const {joinLinkPreview} = message.embed
      return {
        text: isKnownJoinLinkPreview(joinLinkPreview)
          ? `${BSKY_APP_HOST}/chat/${joinLinkPreview.code}`
          : l({
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
      case 'feed':
        return {
          text: l({message: '(feed)', comment: 'A reply summary in chat'}),
          subtle: true,
        }
      case 'list':
        return {
          text: l({message: '(list)', comment: 'A reply summary in chat'}),
          subtle: true,
        }
      case 'starterPack':
        return {
          text: l({
            message: '(starter pack)',
            comment: 'A reply summary in chat',
          }),
          subtle: true,
        }
      case 'labeler':
        return {
          text: l({message: '(labeler)', comment: 'A reply summary in chat'}),
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
