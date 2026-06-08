import {type StyleProp, type ViewStyle} from 'react-native'
import {type AppBskyFeedDefs, type ModerationDecision} from '@atproto/api'

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
  // Post context for analytics on photo embed events (post:photoEmbed:*).
  // When the embed has no owning post (e.g. previews), leave these undefined
  // and no events will be emitted.
  uri?: string
  authorDid?: string
  feedDescriptor?: string
}

export type EmbedProps = CommonProps & {
  embed?: AppBskyFeedDefs.PostView['embed']
}
