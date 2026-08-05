import {memo, useMemo, useState} from 'react'
import {type Insets} from 'react-native'
import {type RichText as RichTextAPI} from '@bsky.app/sdk/richtext'
import {useLingui} from '@lingui/react/macro'

import {type Shadow} from '#/state/cache/post-shadow'
import {EventStopper} from '#/view/com/util/EventStopper'
import {DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontal} from '#/components/icons/DotGrid'
import * as Menu from '#/components/Menu'
import {useMenuControl} from '#/components/Menu'
import {type app} from '#/lexicons'
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
  hitSlop,
  logContext,
  forceGoogleTranslate,
}: {
  testID: string
  post: Shadow<app.bsky.feed.defs.PostView>
  postFeedContext: string | undefined
  postReqId: string | undefined
  big?: boolean
  record: app.bsky.feed.post.Main
  richText: RichTextAPI
  timestamp: string
  threadgateRecord?: app.bsky.feed.threadgate.Main
  onShowLess?: (interaction: app.bsky.feed.defs.Interaction) => void
  hitSlop?: Insets
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
  forceGoogleTranslate: boolean
}): React.ReactNode => {
  const {t: l} = useLingui()

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
        <Menu.Trigger label={l`Open post options menu`}>
          {({props}) => {
            return (
              <PostControlButton
                testID="postDropdownBtn"
                big={big}
                label={props.accessibilityLabel}
                {...props}
                hitSlop={hitSlop}>
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
            logContext={logContext}
            forceGoogleTranslate={forceGoogleTranslate}
          />
        )}
      </Menu.Root>
    </EventStopper>
  )
}

PostMenuButton = memo(PostMenuButton)
export {PostMenuButton}
