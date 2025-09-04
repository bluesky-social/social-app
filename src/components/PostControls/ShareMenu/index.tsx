import {memo, useMemo, useState} from 'react'
import {type Insets} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {useGate} from '#/lib/statsig/statsig'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {type Shadow} from '#/state/cache/post-shadow'
import {EventStopper} from '#/view/com/util/EventStopper'
import {native} from '#/alf'
import {ArrowOutOfBoxModified_Stroke2_Corner2_Rounded as ArrowOutOfBoxIcon} from '#/components/icons/ArrowOutOfBox'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {useMenuControl} from '#/components/Menu'
import * as Menu from '#/components/Menu'
import {PostControlButton, PostControlButtonIcon} from '../PostControlButton'
import {ShareMenuItems} from './ShareMenuItems'

let ShareMenuButton = ({
  testID,
  post,
  big,
  record,
  richText,
  timestamp,
  threadgateRecord,
  onShare,
  hitSlop,
}: {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  big?: boolean
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  timestamp: string
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShare: () => void
  hitSlop?: Insets
}): React.ReactNode => {
  const {_} = useLingui()
  const gate = useGate()

  const ShareIcon = gate('alt_share_icon')
    ? ArrowShareRightIcon
    : ArrowOutOfBoxIcon

  const menuControl = useMenuControl()
  const [hasBeenOpen, setHasBeenOpen] = useState(false)
  const lazyMenuControl = useMemo(
    () => ({
      ...menuControl,
      open() {
        setHasBeenOpen(true)
        // HACK. We need the state update to be flushed by the time
        // menuControl.open() fires but RN doesn't expose flushSync.
        setTimeout(menuControl.open)

        logger.metric(
          'share:open',
          {context: big ? 'thread' : 'feed'},
          {statsig: true},
        )
      },
    }),
    [menuControl, setHasBeenOpen, big],
  )

  const onNativeLongPress = () => {
    logger.metric('share:press:nativeShare', {}, {statsig: true})
    const urip = new AtUri(post.uri)
    const href = makeProfileLink(post.author, 'post', urip.rkey)
    const url = toShareUrl(href)
    shareUrl(url)
    onShare()
  }

  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root control={lazyMenuControl}>
        <Menu.Trigger label={_(msg`Open share menu`)}>
          {({props}) => {
            return (
              <PostControlButton
                testID="postShareBtn"
                big={big}
                label={props.accessibilityLabel}
                {...props}
                onLongPress={native(onNativeLongPress)}
                hitSlop={hitSlop}>
                <PostControlButtonIcon icon={ShareIcon} />
              </PostControlButton>
            )
          }}
        </Menu.Trigger>
        {hasBeenOpen && (
          // Lazily initialized. Once mounted, they stay mounted.
          <ShareMenuItems
            testID={testID}
            post={post}
            record={record}
            richText={richText}
            timestamp={timestamp}
            threadgateRecord={threadgateRecord}
            onShare={onShare}
          />
        )}
      </Menu.Root>
    </EventStopper>
  )
}

ShareMenuButton = memo(ShareMenuButton)
export {ShareMenuButton}
