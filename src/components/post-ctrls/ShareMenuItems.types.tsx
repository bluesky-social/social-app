import {type PressableProps, type StyleProp, type ViewStyle} from 'react-native'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  RichText as RichTextAPI,
} from '@atproto/api'

import {Shadow} from '#/state/cache/post-shadow'

export interface ShareMenuItemsProps {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  postFeedContext: string | undefined
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  hitSlop?: PressableProps['hitSlop']
  size?: 'lg' | 'md' | 'sm'
  timestamp: string
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShare: () => void
}
