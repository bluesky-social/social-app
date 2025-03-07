import {StyleProp, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, ModerationDecision} from '@atproto/api'

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
  allowNestedQuotes?: boolean
  viewContext?: PostEmbedViewContext
}

export type EmbedProps = CommonProps & {
  embed?: AppBskyFeedDefs.PostView['embed']
}
