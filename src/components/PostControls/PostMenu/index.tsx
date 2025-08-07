import {memo, useMemo, useState} from 'react'
import {
  type AppGndrFeedDefs,
  type AppGndrFeedPost,
  type AppGndrFeedThreadgate,
  type RichText as RichTextAPI,
} from '@gander-social-atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {type Shadow} from '#/state/cache/post-shadow'
import {EventStopper} from '#/view/com/util/EventStopper'
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import {useMenuControl} from '#/components/Menu'
import * as Menu from '#/components/Menu'
import {PostControlButton, PostControlButtonIcon} from '../PostControlButton'
import {PostMenuItems} from './PostMenuItems'

let PostMenuButton = ({
  testID,
  post,
  postFeedContext,
  postReqId,
  big,
  record,
  richText,
  timestamp,
  threadgateRecord,
  onShowLess,
}: {
  testID: string
  post: Shadow<AppGndrFeedDefs.PostView>
  postFeedContext: string | undefined
  postReqId: string | undefined
  big?: boolean
  record: AppGndrFeedPost.Record
  richText: RichTextAPI
  timestamp: string
  threadgateRecord?: AppGndrFeedThreadgate.Record
  onShowLess?: (interaction: AppGndrFeedDefs.Interaction) => void
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
              <PostControlButton
                testID="postDropdownBtn"
                big={big}
                label={props.accessibilityLabel}
                {...props}>
                <PostControlButtonIcon icon={DotsHorizontal} />
              </PostControlButton>
            )
          }}
        </Menu.Trigger>
        {hasBeenOpen && (
          // Lazily initialized. Once mounted, they stay mounted.
          <PostMenuItems
            testID={testID}
            post={post}
            postFeedContext={postFeedContext}
            postReqId={postReqId}
            record={record}
            richText={richText}
            timestamp={timestamp}
            threadgateRecord={threadgateRecord}
            onShowLess={onShowLess}
          />
        )}
      </Menu.Root>
    </EventStopper>
  )
}

PostMenuButton = memo(PostMenuButton)
export {PostMenuButton}
