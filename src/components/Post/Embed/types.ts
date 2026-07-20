import {type StyleProp, type ViewStyle} from 'react-native'
import {type ModerationDecision} from '@bsky.app/sdk/moderation'

import {type app} from '#/lexicons'

export enum PostEmbedViewContext {
  ThreadHighlighted = 'ThreadHighlighted',
  Feed = 'Feed',
  FeedEmbedRecordWithMedia = 'FeedEmbedRecordWithMedia',
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
