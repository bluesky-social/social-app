import {type PressableProps, type StyleProp, type ViewStyle} from 'react-native'
import {
  type AppGndrFeedDefs,
  type AppGndrFeedPost,
  type AppGndrFeedThreadgate,
  type RichText as RichTextAPI,
} from '@gander-social-atproto/api'

import {type Shadow} from '#/state/cache/post-shadow'

export interface ShareMenuItemsProps {
  testID: string
  post: Shadow<AppGndrFeedDefs.PostView>
  record: AppGndrFeedPost.Record
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  hitSlop?: PressableProps['hitSlop']
  size?: 'lg' | 'md' | 'sm'
  timestamp: string
  threadgateRecord?: AppGndrFeedThreadgate.Record
  onShare: () => void
}
