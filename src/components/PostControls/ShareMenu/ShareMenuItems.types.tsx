import {type PressableProps, type StyleProp, type ViewStyle} from 'react-native'
import {type RichText as RichTextAPI} from '@bsky.app/sdk/richtext'

import {type Shadow} from '#/state/cache/post-shadow'
import {type app} from '#/lexicons'

export interface ShareMenuItemsProps {
  testID: string
  post: Shadow<app.bsky.feed.defs.PostView>
  record: app.bsky.feed.post.Main
  richText: RichTextAPI
  style?: StyleProp<ViewStyle>
  hitSlop?: PressableProps['hitSlop']
  size?: 'lg' | 'md' | 'sm'
  timestamp: string
  threadgateRecord?: app.bsky.feed.threadgate.Main
  onShare: () => void
}
