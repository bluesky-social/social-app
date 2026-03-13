import {memo, useMemo, useState} from 'react'
import {type Insets} from 'react-native'
import {
  type AppBskyFeedDefs,
  type AppBskyFeedPost,
  type AppBskyFeedThreadgate,
  AtUri,
  type RichText as RichTextAPI,
} from '@atproto/api'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {makeProfileLink} from '#/lib/routes/links'
import {shareUrl} from '#/lib/sharing'
import {toShareUrl} from '#/lib/strings/url-helpers'
import {type Shadow} from '#/state/cache/post-shadow'
import {useFeedFeedbackContext} from '#/state/feed-feedback'
import {EventStopper} from '#/view/com/util/EventStopper'
import {native} from '#/alf'
import {ArrowShareRight_Stroke2_Corner2_Rounded as ArrowShareRightIcon} from '#/components/icons/ArrowShareRight'
import {useMenuControl} from '#/components/Menu'
import * as Menu from '#/components/Menu'
import {useAnalytics} from '#/analytics'
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
  logContext,
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
  logContext: 'FeedItem' | 'PostThreadItem' | 'Post' | 'ImmersiveVideo'
}): React.ReactNode => {
  const ax = useAnalytics()
  const {_} = useLingui()
  const {feedDescriptor} = useFeedFeedbackContext()

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

        ax.metric('post:share', {
          uri: post.uri,
          authorDid: post.author.did,
          logContext,
          feedDescriptor,
          postContext: big ? 'thread' : 'feed',
        })
      },
    }),
    [
      ax,
      menuControl,
      setHasBeenOpen,
      big,
      logContext,
      feedDescriptor,
      post.uri,
      post.author.did,
    ],
  )

  const onNativeLongPress = () => {
    ax.metric('share:press:nativeShare', {})
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
                <PostControlButtonIcon icon={ArrowShareRightIcon} />
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
