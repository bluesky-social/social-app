import {type PressableProps, type StyleProp, type ViewStyle} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
} from '@atproto/api'
import {type RichText as RichTextAPI} from '@bsky.app/sdk/richtext'

import {type Shadow} from '#/state/cache/post-shadow'

export interface ShareMenuItemsProps {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  hitSlop?: PressableProps['hitSlop']
  size?: 'lg' | 'md' | 'sm'
  timestamp: string
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShare: () => void
}
