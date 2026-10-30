import {type StyleProp, type ViewStyle} from 'react-native'
import {type ModerationDecision} from '@bsky/sdk/moderation'

import {type VideoFeedFeedbackAttribution} from '#/lib/media/video/feedFeedback'
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
   * The post that contains this embed. Used for analytics on photo embed
   * events (post:photoEmbed:*). When the embed has no owning post (e.g.
   * composer previews), leave this undefined and no events will be emitted.
   */
  post?: app.bsky.feed.defs.PostView
  feedDescriptor?: string
  /**
   * Feed feedback attribution of the recommended feed item that contains this
   * embed. Passed through quote embeds unchanged, so video watch feedback is
   * attributed to the outer feed item rather than the quoted post. Leave
   * undefined outside feeds and no video watch feedback is sent.
   */
  videoFeedbackAttribution?: VideoFeedFeedbackAttribution
}

export type EmbedProps = CommonProps & {
  embed?: app.bsky.feed.defs.PostView['embed']
}
