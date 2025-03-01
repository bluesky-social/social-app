import {StyleProp, ViewStyle} from 'react-native'
import {AppBskyFeedDefs, ModerationDecision} from '@atproto/api'

import {PostEmbedViewContext} from '#/view/com/util/post-embeds/types'

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
