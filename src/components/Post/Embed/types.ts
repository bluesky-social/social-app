import {type StyleProp, type ViewStyle} from 'react-native'
import {type ModerationDecision} from '@bsky/sdk/moderation'

import {type app} from '#/lexicons'

export enum PostEmbedViewContext {
  ThreadHighlighted = 'ThreadHighlighted',
  Feed = 'Feed',
  ChatMessage = 'ChatMessage',
}

export type CommonProps = {
  moderation?: ModerationDecision
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  viewContext?: PostEmbedViewContext
  isWithinQuote?: boolean
  allowNestedQuotes?: boolean
  /**
   * How a quoted post is laid out. `compact` shows its images, video or GIF
   * as a small square beside its text, and its link as a compact card.
   * Defaults to `compact` beside the post's own media (a record with media),
   * and `default` otherwise.
   */
  quotePresentation?: 'default' | 'compact'
  /**
   * Mutes a quoted post's text, for a quote that previews a post rather than
   * showing it in full.
   */
  isQuoteTextMuted?: boolean
  /**
   * The colour of card borders (quotes and their placeholders, links, feeds
   * and lists) while they aren't hovered, for embeds on a background that
   * `border_contrast_low` doesn't show against.
   */
  borderColor?: string
  /**
   * The post that contains this embed. Used for analytics on photo embed
   * events (post:photoEmbed:*). When the embed has no owning post (e.g.
   * composer previews), leave this undefined and no events will be emitted.
   */
  post?: app.bsky.feed.defs.PostView
  feedDescriptor?: string
}

export type EmbedProps = CommonProps & {
  embed?: app.bsky.feed.defs.PostView['embed']
}
