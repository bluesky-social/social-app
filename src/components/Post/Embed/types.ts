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

/**
 * Optional post context used for media save filenames.
 */
export type PostContextProps = {
  postUri?: string
  postAuthorHandle?: string
  postCreatedAt?: string
}

export type EmbedProps = CommonProps &
  PostContextProps & {
    embed?: AppBskyFeedDefs.PostView['embed']
  }
