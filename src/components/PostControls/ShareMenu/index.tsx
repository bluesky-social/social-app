import {memo, useCallback, useMemo, useState} from 'react'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  AtUri,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {Shadow} from '#/state/cache/post-shadow'
import {EventStopper} from '#/view/com/util/EventStopper'
import {native} from '#/alf'
import {ArrowOutOfBox_Stroke2_Corner0_Rounded as ArrowOutOfBoxIcon} from '#/components/icons/ArrowOutOfBox'
import {useMenuControl} from '#/components/Menu'
import * as Menu from '#/components/Menu'
import {PostControlButton, PostControlButtonIcon} from '../PostControlButton'
import {ShareMenuItems} from './ShareMenuItems'

let ShareMenuButton = ({
  testID,
  post,
  postFeedContext,
  big,
  record,
  richText,
  timestamp,
  threadgateRecord,
  onShare,
}: {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  postFeedContext: string | undefined
  big?: boolean
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  timestamp: string
  threadgateRecord?: AppBskyFeedThreadgate.Record
  onShare: () => void
}): React.ReactNode => {
  const {_} = useLingui()

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
      },
    }),
    [menuControl, setHasBeenOpen],
  )

  const onNativeLongPress = useCallback(() => {
    const urip = new AtUri(post.uri)
    const href = makeProfileLink(post.author, 'post', urip.rkey)
    const url = toShareUrl(href)
    shareUrl(url)
    onShare()
  }, [post, onShare])

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
                onLongPress={native(onNativeLongPress)}>
                <PostControlButtonIcon icon={ArrowOutOfBoxIcon} />
              </PostControlButton>
            )
          }}
        </Menu.Trigger>
        {hasBeenOpen && (
          // Lazily initialized. Once mounted, they stay mounted.
          <ShareMenuItems
            testID={testID}
            post={post}
            postFeedContext={postFeedContext}
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
