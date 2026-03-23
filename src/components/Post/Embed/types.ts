import {type StyleProp, type ViewStyle} from 'react-native'
import {type AppBskyFeedDefs, type ModerationDecision} from '@atproto/api'

export enum PostEmbedViewContext {
  ThreadHighlighted = 'ThreadHighlighted',
  Feed = 'Feed',
  FeedEmbedRecordWithMedia = 'FeedEmbedRecordWithMedia',
}

export enum QuoteEmbedViewContext {
  FeedEmbedRecordWithMedia = PostEmbedViewContext.FeedEmbedRecordWithMedia,
}

export type CommonProps = {
  moderation?: ModerationDecision
  onOpen?: () => void
  style?: StyleProp<ViewStyle>
  viewContext?: PostEmbedViewContext
  isWithinQuote?: boolean
  allowNestedQuotes?: boolean
}

export type EmbedProps = CommonProps & {
  embed?: AppBskyFeedDefs.PostView['embed']
}
