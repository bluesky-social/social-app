import {type StyleProp, type ViewStyle} from 'react-native'
import {type AppBskyFeedDefs, type ModerationDecision} from '@atproto/api'

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
   * The post that contains this embed. Used for analytics on photo embed
   * events (post:photoEmbed:*). When the embed has no owning post (e.g.
   * composer previews), leave this undefined and no events will be emitted.
   */
  post?: AppBskyFeedDefs.PostView
  feedDescriptor?: string
}

export type EmbedProps = CommonProps & {
  embed?: AppBskyFeedDefs.PostView['embed']
}
