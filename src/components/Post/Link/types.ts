import {PressableProps} from 'react-native'
import {AppBskyFeedDefs} from '@atproto/api'

import {LinkProps} from '#/components/Link'

export type Props = Pick<LinkProps, 'onPress' | 'style' | 'testID'> &
  Pick<PressableProps, 'onPointerEnter' | 'onPointerLeave'> & {
    children:
      | React.ReactElement
      | Iterable<React.ReactElement | null | undefined | boolean>
    post: AppBskyFeedDefs.PostView
    reason?:
      | AppBskyFeedDefs.ReasonRepost
      | AppBskyFeedDefs.ReasonPin
      | {[k: string]: unknown; $type: string}
      | undefined
  }
