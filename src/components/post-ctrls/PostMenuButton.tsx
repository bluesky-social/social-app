import React, {memo, useMemo, useState} from 'react'
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyFeedThreadgate,
  RichText as RichTextAPI,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {Shadow} from '#/state/cache/post-shadow'
import {EventStopper} from '#/view/com/util/EventStopper'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {useMenuControl} from '#/components/Menu'
import * as Menu from '#/components/Menu'
import {PostCtrlButton, PostCtrlButtonIcon} from './PostCtrlButton'
import {PostMenuItems} from './PostMenuItems'

let PostMenuButton = ({
  testID,
  post,
  postFeedContext,
  big,
  record,
  richText,
  timestamp,
  threadgateRecord,
}: {
  testID: string
  post: Shadow<AppBskyFeedDefs.PostView>
  postFeedContext: string | undefined
  big?: boolean
  record: AppBskyFeedPost.Record
  richText: RichTextAPI
  timestamp: string
  threadgateRecord?: AppBskyFeedThreadgate.Record
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
  return (
    <EventStopper onKeyDown={false}>
      <Menu.Root control={lazyMenuControl}>
        <Menu.Trigger label={_(msg`Open post options menu`)}>
          {({props}) => {
            return (
              <PostCtrlButton
                testID="postDropdownBtn"
                big={big}
                label={props.accessibilityLabel}
                {...props}>
                <PostCtrlButtonIcon icon={DotsHorizontal} />
              </PostCtrlButton>
            )
          }}
        </Menu.Trigger>
        {hasBeenOpen && (
          // Lazily initialized. Once mounted, they stay mounted.
          <PostMenuItems
            testID={testID}
            post={post}
            postFeedContext={postFeedContext}
            record={record}
            richText={richText}
            timestamp={timestamp}
            threadgateRecord={threadgateRecord}
          />
        )}
      </Menu.Root>
    </EventStopper>
  )
}

PostMenuButton = memo(PostMenuButton)
export {PostMenuButton}
